var fs = require('fs');
var express = require('express');
var bodyParser = require('body-parser');
var async = require('async');
var moment = require('moment');
var qs = require('querystring');
var http = require('http');
var compression = require('compression');
var request = require('request-promise');
var uuid = require('uuid');
var pg = require('pg');
var passport = require('passport');
var Auth0Strategy = require('passport-auth0');
var elasticsearch = require('elasticsearch');
var morgan = require('morgan');
var Auth0 = require('auth0');
var React = require('react');
require('node-jsx').install({extension: '.jsx', harmony: true });
var PartialQuery = require('./server/partialquery');

if (process.env.BUILD_ON_RUN || !fs.existsSync('static/styles.css') || !fs.existsSync('static/bundle.js')) {
  require('./build.js'); // build static assets
}

var app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

var DATABASE_URL = process.env.DATABASE_URL || 'postgres://localhost:5432/deepstack';
console.log('Using postgres database:', DATABASE_URL);

var PUBLIC_PACKAGE_REPOSITORY_HOST = process.env.PUBLIC_PACKAGE_REPOSITORY_HOST;
console.log('Using packages host:', PUBLIC_PACKAGE_REPOSITORY_HOST);

var INTERNAL_HOST = process.env.INTERNAL_HOST;
console.log('Using internal hostname:', INTERNAL_HOST);

var VALIDATOR_HOST = process.env.VALIDATOR_HOST;
console.log('Using validator host:', VALIDATOR_HOST);

var ELASTICSEARCH_HOST = process.env.ELASTICSEARCH_HOST;
console.log('Using elasticsearch host:', ELASTICSEARCH_HOST);

function runSQLFile(filename, callback) {
  var statements = fs.readFileSync(filename).toString().split(';');
  pg.connect(DATABASE_URL, function(err, client, closeClient) {
    if (err) console.log('Connection error', err);
    async.mapSeries(statements, function(statement, done) {
      client.query(statement, function(err, result) {
        if (err) console.log('Query error', err);
        console.log('Res', result);
        done(err);
      });
    }, function(err, res) {
      closeClient();
      callback();
    });
  });
}

var auth0api = new Auth0({
  domain: process.env.AUTH0_DOMAIN,
  clientID: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
});

passport.use(new Auth0Strategy({
    domain: process.env.AUTH0_DOMAIN,
    clientID: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    callbackURL: '/auth/callback'
  }, function(accessToken, refreshToken, extraParams, profile, done) {
    // accessToken is the token to call Auth0 API (not needed in the most cases)
    // extraParams.id_token has the JSON Web Token
    // profile has all the information from the user
    profile.username = profile._json.username;
    return done(null, profile);
  }));

// This is not a best practice, but we want to keep things simple for now
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

var cookieParser = require('cookie-parser');
var session = require('express-session');

app.use(cookieParser());
app.use(session({ secret: 'shhhhhhhhh' }));
app.use(passport.initialize());
app.use(passport.session());

app.get('/auth/callback',
  passport.authenticate('auth0', { failureRedirect: '/url-if-something-fails' }),
  function(req, res) {
    if (!req.user) {
      throw new Error('user null');
    }
    console.log(req.user);
    res.redirect('/' + req.user.username);
  });

var esClient = new elasticsearch.Client({
  host: ELASTICSEARCH_HOST
});

app.use(morgan('combined'));

app.use('/static', compression(), express.static('static'));

app.get('/reset', function(req, res) {
  runSQLFile('schema.sql', function() {
    res.json({ ok: true });
  });
});

app.get('/reindex', function(req, res, next) {
  esClient.deleteByQuery({
    index: 'docs',
    q: '*'
  }, function(err, delRes) {
    console.log('Delete all docs res', err, delRes);

    request('http://' + PUBLIC_PACKAGE_REPOSITORY_HOST + '/v1/_all')
      .then(function(packages) {
        packages = JSON.parse(packages);
        var r = packages.map(function(package) {
          return request('http://' + PUBLIC_PACKAGE_REPOSITORY_HOST + '/v1/'
            + package.username + '/' + package.package + '/' + package.version + '/package.zip/package.json')
            .then(function(packageJson) {
              esIndexPackage(package.username, JSON.parse(packageJson));
            });
        });
        return Promise.all(r).then(function() {
          res.send({ ok: true });
        });
      })
      .catch(next);
  });
});

function clientQuery(client, sql, params) {
  if (!client) throw new Error('client must be specified');
  return new Promise(function(resolve, reject) {
    var handler = function(err, result) {
      if (err) reject(err);
      else resolve(result);
    }
    if (params) client.query(sql, params, handler);
    else client.query(sql, handler);
  });
}

var components = {};
fs.readdirSync('components').map(function(component) {
  var name = component.substring(0, component.length - '.jsx'.length);
  components[name] = React.createFactory(require('./components/' + component));
});

function safeStringify(obj) {
  return JSON.stringify(obj).replace(/<\/script/g, '<\\/script').replace(/<!--/g, '<\\!--')
}
function renderPage(req, res) {
  var data = req.renderData;
  data.host = req.headers.host;
  data.auth0Domain = process.env.AUTH0_DOMAIN;
  data.auth0ClientID = process.env.AUTH0_CLIENT_ID;
  if (req.user) {
    data.profileName = req.user.username;
    data.profileLink = '/' + req.user.username;
  }
  res.setHeader('Content-Type', 'text/html');
  res.send(React.renderToStaticMarkup(
    components.Html({
      script: "var APP_DATA = " + safeStringify(data) + ";\n" +
        "var React = require('react');\n" +
        "var App = React.createFactory(require('App'));\n" +
        "var InnerComponent = React.createFactory(require('" + data.component + "'));\n" +
        "React.render(App(APP_DATA, InnerComponent(APP_DATA.content)), document.getElementById('main'))\n",
      html: React.renderToString(
        components.App(data,
          components[data.component](data.content)
        )
      )
    })));
  if (req.pgCloseClient) {
    req.pgCloseClient();
    req.pgCloseClient = null;
  }
}

var queries = {};

app.use(function createRequestId(req, res, next) {
  req.requestId = uuid.v1();
  next();
});

app.get('/favicon.ico', function(req, res) {
  res.sendfile('static/favicon.ico');
});


app.post('/private/api/v1/validated', pgClient, function(req, res, next) {
  console.log('GOT VALIDATED', req.body, req.query.packageid);

  var updates = req.body.scores
    .map(function(s) {
      if (!s.hasOwnProperty('score')) s.score = 'failed';
      return clientQuery(
        req.pgClient,
        'update validations set status=$1 where packageid=$2 and validationname=$3',
        [''+s.score, req.query.packageid, s.name]
      );
    });

  Promise.all(updates)
    .then(function() {
      res.json({ status: 'ok' });
    });
});

function esIndexPackage(username, packageJson) {
  packageJson.username = username;
  esClient.index({
    index: 'docs',
    type: 'doc',
    id: username + '/' + packageJson.name,
    body: packageJson
  }, function(err, response) {
    if (err) {
      console.log('failed to index package.json', err);
    }
  });
}

app.post('/private/api/v1/packagesevent', bodyParser.json(), pgClient, function(req, res, next) {
  console.log('GOT PACKAGES REPO EVENT', req.query);
  console.log(JSON.stringify(req.body));
  // Index package
  esIndexPackage(req.body.username, req.body.packageJson);

  // Validate
  if (req.body.packageJson.validators) {
    var packageid = req.body.username + '/' + req.body.packageJson.name + '/' + req.body.packageJson.version;

    var inserts = req.body.packageJson.validators
      .map(function(v) {
        return clientQuery(
          req.pgClient,
          'insert into validations (packageid, validationname, status) values ($1, $2, $3)',
          [packageid, v.name, 'RUNNING']
        );
      });

    Promise.all(inserts)
      .then(function() {
        var url = 'http://' + VALIDATOR_HOST + '/api/v0/validate?' + qs.stringify({
          project: packageid,
          callback: 'http://' + INTERNAL_HOST + '/private/api/v1/validated?' + qs.stringify({
            packageid: packageid
          })
        });
        return request.post(url);
      })
      .then(function(res) {
        console.log('Validate post result', res.statusCode);
      })
      .catch(printError);
  }
});

// ---- PAGES -----

app.get('/', function(req, res, next) {

  var data = req.renderData = {};
  data.component = 'Home';
  data.content = {};
  data.content.isLoggedIn = !!req.user;
  data.content.packagesHost = PUBLIC_PACKAGE_REPOSITORY_HOST;
  data.logoMuted = true;

  request('http://' + PUBLIC_PACKAGE_REPOSITORY_HOST + '/v1/_packagescount')
    .then(function(res) {
      res = JSON.parse(res);
      console.log('RESULT', res, res.count)
      data.content.npackages = res.count;
      next();
    })
    .catch(next);
}, renderPage);

app.get('/all', function(req, res, next) {

  var data = req.renderData = {};
  data.component = 'List';
  data.content = {};
  data.content.isLoggedIn = !!req.user;
  data.content.title = 'All Packages';

  request('http://' + PUBLIC_PACKAGE_REPOSITORY_HOST + '/v1/_packages')
    .then(function(packages) {
      packages = JSON.parse(packages);
      data.content.packages = packages.map(function(package) {
        package.url = '/' + package.username + '/' + package.package;
        return package;
      });
      next();
    })
    .catch(next);
}, renderPage);

app.get('/search', function(req, res, next) {
  // TODO falcon: pagination
  esClient.search({
    index: 'docs',
    type: 'doc',
    body: {
      query: {
        multi_match: {
          query: req.query.q,
          fields: ['name', 'description']
        }
      }
    }
  }).then(function (result) {
    var data = req.renderData = {};
    data.component = 'List';
    data.content = {};
    data.content.isLoggedIn = !!req.user;

    var total = result.hits.total;
    data.content.title = [
      total,
      (total === 1 ? 'result' : 'results'),
      'matching',
      req.query.q
    ].join(' ');
    data.content.packages = result.hits.hits.map(function(hit) {
      var package = hit._source;
      package.package = package.name;
      package.url = '/' + package.username + '/' + package.name;
      return package;
    });
    next();
  }, function (err) {
    console.log('search failed', err);
    next({ type: 'user-error', message: 'Search failed' });
  });
}, renderPage);

function lookupPathUser(req, res, next) {
  auth0api.getUserBySearch('username:' + req.params.username, function(err, accounts) {
    if (err || !accounts || accounts.size == 0) {
      return renderPage('Error', {content: {message: 'Unknown user.'}}, req, res);
    }
    req.pathUser = accounts[0];
    next();
  });
}

function pgClient(req, res, next) {
  pg.connect(DATABASE_URL, function(err, client, closeClient) {
    if (err) {
      next(err);
    } else {
      req.pgClient = client;
      req.pgCloseClient = closeClient;
      next();
    }
  });
}

app.get('/:username', lookupPathUser, function(req, res, next) {
  var data = req.renderData = {};
  data.component = 'User';
  data.content = {};
  data.content.username = req.params.username;

  request('http://' + PUBLIC_PACKAGE_REPOSITORY_HOST + '/v1/' + encodeURIComponent(req.pathUser.username) + '/_packages')
    .then(function(packages) {
      packages = JSON.parse(packages);
      data.content.packages = packages.map(function(package) {
        package.url = '/' + package.username + '/' + package.package;
        return package;
      });
      next();
    })
    .catch(next);
}, renderPage);

function renderProject(req, res, next) {
  var data = req.renderData = {};
  data.component = 'Project';
  data.content = {};
  data.content.username = req.params.username;
  data.content.project = req.params.project;
  data.content.packagesHost = PUBLIC_PACKAGE_REPOSITORY_HOST;

  var packageUrl = 'http://' + PUBLIC_PACKAGE_REPOSITORY_HOST + '/v1/' + encodeURIComponent(req.params.username) + '/' + encodeURIComponent(req.params.project);

  request(packageUrl + '/_versions')
    .then(function(versions) {
      versions = JSON.parse(versions);
      versions.reverse();
      data.content.versions = versions.map(function(version) {
        return {
          name: version.version,
          url: '/' + version.username + '/' + version.package + '/' + version.version
        }
      });
      data.content.version = req.params.version || versions[0].version;
    })
    .then(function() {
      return request(packageUrl + '/' + data.content.version + '/package.zip/README.md')
        .then(function(readme) {
          data.content.readme = readme;
        });
    })
    .then(function() {
      data.content.downloadPath = packageUrl + '/' + data.content.version + '/package.zip';

      var packageid = req.pathUser.username + '/' + req.params.project + '/' + data.content.version;
      return clientQuery(req.pgClient, 'select * from validations where packageid=$1',
        [packageid])
        .then(function(validations) {
          data.content.validations = validations.rows;
          renderPage(req, res);
        });
    });
}

app.get('/:username/:project', pgClient, lookupPathUser, renderProject);

app.get('/:username/:project/:version', pgClient, lookupPathUser, renderProject);

app.use(function errorHandler(err, req, res, next) {
  if (err.type == 'user-error') {
    req.renderData = {
      component: 'Error',
      content: { message: err.message },
    }
    renderPage(req, res);
  } else {
    next(err);
  }
});

var port = process.env.PORT || 8095;
if (typeof(port) === 'string') port = parseInt(port);
if (typeof(port) !== 'number') {
  console.log('Bad port: ', process.env.PORT);
  process.exit(1);
}
app.listen(port, function() {
  console.log("Listening on " + port);
});

function printError(err) {
  console.log('Promise failed', err);
  console.log(err.stack);
}
