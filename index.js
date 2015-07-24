var fs = require('fs');
var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var async = require('async');
var moment = require('moment');
//var stormpath = require('express-stormpath');
var multer  = require('multer');
var qs = require('querystring');
var less = require('less');
var UglifyJS = require('uglify-js');
var AdmZip = require('adm-zip');
var browserify = require('browserify');
var http = require('http');
var compression = require('compression');
var auth = require('basic-auth');
var streamToBuffer = require('stream-to-buffer');
var uuid = require('uuid');
var pg = require('pg');
var passport = require('passport');
var Auth0Strategy = require('passport-auth0');
var elasticsearch = require('elasticsearch');
var Auth0 = require('auth0');
var React = require('react');
require('node-jsx').install({extension: '.jsx', harmony: true });
var FSStorage = require('./server/fsstorage');
var S3Storage = require('./server/s3storage');
var PartialQuery = require('./server/partialquery');

var app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

var DATABASE_URL = process.env.DATABASE_URL || 'postgres://localhost:5432/deepstack';

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

var strategy = new Auth0Strategy({
    domain: process.env.AUTH0_DOMAIN,
    clientID: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    callbackURL: '/auth/callback'
  }, function(accessToken, refreshToken, extraParams, profile, done) {
    // accessToken is the token to call Auth0 API (not needed in the most cases)
    // extraParams.id_token has the JSON Web Token
    // profile has all the information from the user
    return done(null, profile);
  });

passport.use(strategy);

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
    res.redirect('/' + req.user._json.username);
  });

var esClient = new elasticsearch.Client({
  host: process.env.BONSAI_URL || 'localhost:9200'
});

app.use(function requestLogger(req, res, next) {
  console.log(req.method + ' ' + req.url);
  next();
});

app.use('/static', express.static('static'));

app.get('/reset', function(req, res) {
  runSQLFile('schema.sql', function() {
    res.json({ ok: true });
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

(function createBundle() {
  var b = browserify();
  var browserifyArgs = fs.readdirSync('components').map(function(component) {
    console.log('Adding', './components/' + component)
    b.require('./components/' + component, { entry: false, expose: component.substring(0, component.length - '.jsx'.length) });
  });
  b.require('react');
  b.transform('reactify', { es6: true });
  b.transform('brfs');
  var bundle = 'throw new Error("Bundle not ready yet!")';
  streamToBuffer(b.bundle(), function(err, buffer) {
    if (err) {
      console.log(err);
      process.exit();
    }
    bundle = buffer.toString();
    console.log('Bundle created');
    if (!process.env.DEVELOP) {
      var result = UglifyJS.minify(bundle, {fromString: true});
      console.log('Bundle minified');
      bundle = result.code;
    }
    console.log("\007");
  });

  app.get('/bundle.js', compression(), function(req, res) {
    res.setHeader('Content-Type', 'application/javascript');
    res.send(bundle);
  });
})();

(function createCss() {
  var source = fs.readdirSync('components').map(function(component) {
    var c = require('./components/' + component);
    return c.styles || '';
  }).join('\n');
  source += '\n' + fs.readFileSync('styles.less');
  var lessCss = '';
  less.render(source, { filename: path.resolve('./styles.less') }, function(error, output) {
    if (error) {
      fs.writeFileSync('tmp.error.less', source);
      console.log(error);
      process.exit();
    }
    lessCss = output.css;
    console.log('Less compiled')
  });
  app.get('/bundle.css', function(req, res) {
    res.setHeader('Content-Type', 'application/css');
    res.send(lessCss);
  });
})()


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
queries.allProjects = new PartialQuery('select userid, projectname, username from cached_project_versions group by userid, projectname, username');
queries.countAllProject = new PartialQuery('select count(*) as nprojects from ($[allProjects]) as allprojects', { allProjects: queries.allProjects });

var storage;
if (process.env.AWS_ACCESS_KEY) storage = new S3Storage();
else storage = new FSStorage(app);

function persistlog(pgClient, data) {
  data.timestamp = Date.now();
  console.log('Persistent logging', data);
  clientQuery(pgClient, 'insert into logs (timestamp, data) values ($1, $2)',
    [new Date(data.timestamp), data])
    .catch(printError);
}

app.use(function createRequestId(req, res, next) {
  req.requestId = uuid.v1();
  next();
});

app.get('/favicon.ico', function(req, res) {
  res.sendfile('static/favicon.ico');
});

app.post('/api/v1/upload', pgClient, multer({ dest: './uploads/' }), function(req, res, next) {
  console.log(req.files);
  persistlog(req.pgClient, {
    type: 'upload-attempt',
    requestId: req.requestId
  });
  var user = auth(req);
  req.app.get('stormpathApplication').authenticateAccount({
    username: user.name,
    password: user.pass
  }, function(err, result) {
    if (err) {
      res.status(401).send(err.userMessage);
      return;
    }
    var stormpathUser = result.account;
    stormpathUser.id = stormpathUserHrefToId(stormpathUser.href);

    var zip = new AdmZip(req.files.package.path);
    var packageJson = zip.readAsText('package.json');
    var readme = zip.readAsText('README.md');
    try {
      packageJson = JSON.parse(packageJson);
    } catch(err) {
      res.status(400).send('Could not parse package.json');
      return;
    }
    console.log(packageJson);
    var body = fs.createReadStream(req.files.package.path);
    var key = stormpathUser.id + '-' + packageJson.name + '-' + packageJson.version + '.zip';
    storage.exists(key).then(function(exists) {
      if (exists) {
        res.status(409).send('Package already extists at version ' + packageJson.version);
        return;
      }
      return storage.upload(key, body)
        .then(clientQuery(req.pgClient, 'insert into cached_project_versions (userid, projectname, version, username, readme) values ($1, $2, $3, $4, $5)',
                [stormpathUser.id, packageJson.name, packageJson.version, stormpathUser.username, readme]))
        .then(function() {
          // add the username for consistency
          packageJson.username = user.name;
          esClient.index({
            index: 'docs',
            type: 'doc',
            id: user.name + '/' + packageJson.name,
            body: packageJson
          }, function(err, response) {
            if (err) {
              // don't let this fail the request. we can run reindex jobs
              // nightly or something along those lines.
              console.log('failed to index package.json', err);
            }
          });
        })
        .then(function() {
          console.log('Checking for verifiers...', packageJson.verifiers)
          if (packageJson.verifiers) {
            packageJson.verifiers.forEach(function(verifier) {
              clientQuery(req.pgClient, 'insert into cached_project_verifications (userid, projectname, version, verificationName, status) values ($1, $2, $3, $4, $5)',
                      [stormpathUser.id, packageJson.name, packageJson.version, verifier.name, 'RUNNING'])
                .then(function() {
                  http.request({
                    hostname: 'localhost',
                    port: 8080,
                    path: '/api/v0/dummyverify?' + qs.stringify({
                      verificationImage: verifier.name,
                      callback: 'http://' + req.headers.host + '/private/api/v1/verified?' + qs.stringify({
                        userid: stormpathUser.id,
                        projectName: packageJson.name,
                        version: packageJson.version,
                        verificationName: verifier.name
                      })
                    }),
                    method: 'POST'
                  }, function(res) {
                    console.log('Verify post result', res.statusCode);
                  }).end();
                }).catch(printError);
            });
          }
        })
        .then(function() {
          persistlog(req.pgClient, {
            type: 'upload-success',
            requestId: req.requestId,
            loggedInUserHref: stormpathUser.href,
            loggedInUserId: stormpathUser.id,
            loggedInUsername: stormpathUser.username,
            uploadFileKey: key,
            packageJson: packageJson
          });
        })
        .then(function() {
          req.pgCloseClient();
          res.send('OK');
        })
    }).catch(next);
  });
});

app.post('/private/api/v1/verified', pgClient, function(req, res, next) {
  console.log('GOT VERIFIED', req.body);
  clientQuery(req.pgClient, 'update cached_project_verifications set status=$1 where userid=$2 and projectname=$3 and version=$4 and verificationName=$5',
          [req.body.score, req.query.userid, req.query.projectName, req.query.version, req.query.verificationName])
    .then(function() {
      res.json({ status: 'ok' });
    });
});

app.post('/private/api/v1/dockerevents', bodyParser.json({ type: 'application/vnd.docker.distribution.events.v1+json' }), function(req, res, next) {
  console.log('GOT DOCKER EVENT', req.query);
  console.log(JSON.stringify(req.body));
  res.send('OK');
});

// ---- PAGES -----
app.use(pgClient);
app.use(function persistlogMiddleware(req, res, next) {
  persistlog(req.pgClient, {
    event: 'page-requested',
    path: req.path,
    method: req.method,
    requestId: req.requestId,
    loggedInUserHref: req.user ? req.user.href : null,
    loggedInUsername: req.user ? req.user.username : null
  });
  next();
});

app.get('/', function(req, res, next) {

  var data = req.renderData = {};
  data.component = 'Home';
  data.content = {};
  data.content.isLoggedIn = !!req.user;
  data.content.host = req.headers.host;
  data.logoMuted = true;

  clientQuery(req.pgClient, queries.countAllProject.toQuery())
    .then(function(result) {
      data.content.nprojects = result.rows[0].nprojects;
      next();
    }).catch(next);
}, renderPage);

app.get('/all', function(req, res, next) {

  var data = req.renderData = {};
  data.component = 'List';
  data.content = {};
  data.content.isLoggedIn = !!req.user;
  data.content.title = 'All Projects';

  clientQuery(req.pgClient, queries.allProjects.toQuery())
    .then(function(result) {
      data.content.projects = result.rows.map(function(project) {
        project.url = '/' + project.username + '/' + project.projectname;
        return project;
      });
      next();
    }).catch(next);
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
    data.content.projects = result.hits.hits.map(function(hit) {
      var project = hit._source;
      project.projectname = project.name;
      project.url = '/' + project.username + '/' + project.name;
      return project;
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

  clientQuery(req.pgClient, 'select projectname from cached_project_versions where userid=$1 group by projectname',
          [req.pathUser.id])
    .then(function(result) {
      req.pgCloseClient();
      console.log('Insert res', result);
      data.content.projects = result.rows.map(function(project) {
        project.url = '/' + req.pathUser.username + '/' + project.projectname;
        return project;
      });
      next();
    }).catch(next);
}, renderPage);

function renderProject(req, res, next) {
  var data = req.renderData = {};
  data.component = 'Project';
  data.content = {};
  data.content.username = req.params.username;
  data.content.project = req.params.project;
  data.content.host = req.headers.host;

  clientQuery(req.pgClient, 'select * from cached_project_versions where userid=$1 and projectname=$2 order by version desc',
          [req.pathUser.id, req.params.project])
    .then(function(result) {
      req.pgCloseClient();
      //console.log('Insert res', result);
      data.content.versions = result.rows.map(function(project) {
        return {
          name: project.version,
          url: '/' + req.params.username + '/' + req.params.project + '/' + project.version
        }
      });
      if (req.params.version) {
        var activeVersion = result.rows.filter(function(project) {
          return project.version == req.params.version;
        })[0];
        if (!activeVersion) {
          throw new Error('No such version');
        }
      } else {
        var activeVersion = result.rows[0];
      }
      data.content.readme = activeVersion.readme;
      data.content.version = activeVersion.version;
      data.content.downloadPath = '/' + req.params.username + '/' + req.params.project + '/' + activeVersion.version + '/package.zip';


      return clientQuery(req.pgClient, 'select * from cached_project_verifications where userid=$1 and projectname=$2 and version=$3',
        [req.pathUser.id, req.params.project, data.content.version])
        .then(function(validations) {
          data.content.validations = validations.rows;
          renderPage(req, res);
        });
    }).catch(function() {
      next({ type: 'user-error', message: 'Unknown project.' });
    });
}

app.get('/:username/:project', lookupPathUser, renderProject);

app.get('/:username/:project/package.zip', lookupPathUser, function(req, res, next) {
  clientQuery(req.pgClient, 'select * from cached_project_versions where userid=$1 and projectname=$2 order by version desc limit 1',
          [req.pathUser.id, req.params.project])
    .then(function(result) {
      req.pgCloseClient();
      res.redirect('/' + req.params.username + '/' + req.params.project + '/' + result.rows[0].version + '/package.zip');
    }).catch(function() {
      next({ type: 'user-error', message: 'Unknown project.' });
    });
});

app.get('/:username/:project/:version', lookupPathUser, renderProject);

app.get('/:username/:project/:version/package.zip', lookupPathUser, function(req, res, next) {
  var key = req.pathUser.id + '-' + req.params.project + '-' + req.params.version + '.zip';
  persistlog(req.pgClient, {
    type: 'download-package',
    requestId: req.requestId,
    loggedInUserHref: req.user ? user.href : null,
    loggedInUsername: req.user ? user.username : null,
    packageUsername: req.pathUser.username,
    packageUserHref: req.pathUser.href,
    packageProject: req.params.project,
    packageVersion: req.params.version,
  });
  res.redirect(storage.urlForKey(key));
  req.pgCloseClient();
});

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
app.listen(port, function() {
  console.log("Listening on " + port);
});

function printError(err) {
  console.log('Promise failed', err);
  console.log(err.stack);
}
