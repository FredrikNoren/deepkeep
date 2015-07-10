var fs = require('fs');
var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var async = require('async');
var moment = require('moment');
var merge = require('merge');
var stormpath = require('express-stormpath');
var multer  = require('multer')
var less = require('less');
var AdmZip = require('adm-zip');
var browserify = require('browserify');
var auth = require('basic-auth');
var aws = require('aws-sdk');
var streamToBuffer = require('stream-to-buffer');
var uuid = require('uuid');
var pg = require('pg');
var React = require('react');
require('node-jsx').install({extension: '.jsx', harmony: true });

var app = express();

app.use(bodyParser.urlencoded({ extended: false }));

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

app.use(stormpath.init(app, {
    apiKeyFile: 'apiKey-2RZ5G43WQYYMW6GFWTM865I17.properties',
    application: 'https://api.stormpath.com/v1/applications/6xIObjnyqyxBynY5R7shov',
    secretKey: 'some_long_random_string',
    enableUsername: true,
    requireUsername: true,
    debug: true,
    postLoginHandler: function(account, req, res, next) {
      account.id = stormpathUserHrefToId(account.href);
      next();
    }
}));

function requestLogger(req, res, next) {
  console.log(req.method + ' ' + req.url);
  next();
}
app.use(requestLogger);

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login?backUrl=' + encodeURIComponent(req.url));
};

app.get('/reset', function(req, res) {
  runSQLFile('schema.sql', function() {
    res.json({ ok: true });
  });
});

function clientQuery(client, sql, params) {
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
  var bundle = 'throw new Error("Bundle not ready yet!")';
  streamToBuffer(b.bundle(), function(err, buffer) {
    if (err) {
      console.log(err);
      process.exit();
    }
    bundle = buffer.toString();
    console.log('Bundle created');
    console.log("\007");
  });

  app.get('/bundle.js', function(req, res) {
    res.setHeader('Content-Type', 'application/javascript');
    res.send(bundle);
  });
})();

(function createCss() {
  var source = fs.readdirSync('components').map(function(component) {
    var c = require('./components/' + component);
    return c.styles || '';
  }).join('\n');
  source += '\n' + fs.readFileSync('node_modules/highlight.js/styles/default.css');
  source += '\n' + fs.readFileSync('styles.less');
  var lessCss = '';
  less.render(source, {}, function(error, output) {
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
function renderPage(component, data, req, res) {
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
        "var InnerComponent = React.createFactory(require('" + component + "'));\n" +
        "React.render(App(APP_DATA, InnerComponent(APP_DATA.content)), document.getElementById('main'))\n",
      html: React.renderToString(
        components.App(data,
          components[component](data.content)
        )
      )
    })));
}

function PartialQuery(sql, params) {
  this.sql = sql;
  this.params = params || {};
}
PartialQuery.prototype.bindParams = function(params) {
  return new PartialQuery(this.sql, merge(this.params, params));
}
PartialQuery.prototype.toQuery = function(params, values) {
  if (values === undefined) values = [];
  var localParams = merge(this.params, params);
  var sql = this.sql.replace(/\$\[.*\]/g, function(param) {
    param = param.substring(2, param.length - 1);
    var p = localParams[param];
    if (p instanceof PartialQuery) {
      return p.toQuery(params, values).text;
    } else {
      values.push(p);
      return '$' + values.length;
    }
  }.bind(this));
  return { text: sql, values: values };
}
var queries = {};


app.get('/', function(req, res) {

  var data = {};
  data.content = {}
  data.content.isLoggedIn = !!req.user;
  data.logoMuted = true;

  renderPage('Home', data, req, res);
});

app.get('/favicon.ico', function(req, res) {
  res.status(404).send('Not found');
});

app.post('/api/v1/upload', multer({ dest: './uploads/' }), pgClient, function(req, res, next) {
  console.log(req.files);
  var user = auth(req);
  req.app.get('stormpathApplication').authenticateAccount({
    username: user.name,
    password: user.pass
  }, function(err, result) {
    if (err) {
      res.status(401).send(err.userMessage);
      return;
    }
    req.app.get('stormpathApplication').getAccounts({ username: req.params.username }, function(err, accounts) {
      var stormpathUser = accounts.items[0];
      stormpathUser.id = stormpathUserHrefToId(stormpathUser.href);

      var zip = new AdmZip(req.files.package.path);
      var packageJson = zip.readAsText('package.json');
      try {
        packageJson = JSON.parse(packageJson);
      } catch(err) {
        res.status(400).send('Could not parse package.json');
        return;
      }
      console.log(packageJson);
      var body = fs.createReadStream(req.files.package.path);
      var s3obj = new aws.S3({
        params: {
          Bucket: S3_BUCKET,
          Key: stormpathUser.id + '-' + packageJson.name + '-' + packageJson.version + '.zip',
          ACL: 'public-read'
        }
      });
      s3obj.upload({ Body: body }).
        on('httpUploadProgress', function(evt) { console.log(evt); }).
        send(function(err, data) {
          clientQuery(req.pgClient, 'insert into cached_project_versions (userid, name, version, readme) values ($1, $2, $3, $4)',
                  [stormpathUser.id, packageJson.name, packageJson.version, packageJson.readme])
            .then(function(result) {
              console.log('DONE', result);
              res.send('OK');
              req.pgCloseClient();
            }).catch(next);
        });
    });
  });
});

var AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY;
var AWS_SECRET_KEY = process.env.AWS_SECRET_KEY;
var S3_BUCKET = process.env.S3_BUCKET;
aws.config.update({ accessKeyId: AWS_ACCESS_KEY, secretAccessKey: AWS_SECRET_KEY });
var s3 = new aws.S3({ params: { Bucket: S3_BUCKET }});

function lookupPathUser(req, res, next) {
  req.app.get('stormpathApplication').getAccounts({ username: req.params.username }, function(err, accounts) {
    req.pathUser = accounts.items[0];
    req.pathUser.id = stormpathUserHrefToId(req.pathUser.href);
    next();
  });
}

function ensureUserOwned(req, res, next) {
  if (!req.user || req.user.href != req.pathUser.href) {
    res.status(401).send('Not authorized');
  } else {
    next();
  }
}

function stormpathUserHrefToId(href) {
  return href.substring('https://api.stormpath.com/v1/accounts/'.length);
}

function pgClient(req, res, next) {
  pg.connect(DATABASE_URL, function(err, client, closeClient) {
    if (err) {
      console.log('Failed to connect to database', err);
      res.status(500).send('Failed to connect to database');
    } else {
      req.pgClient = client;
      req.pgCloseClient = closeClient;
      next();
    }
  });
}

app.get('/:username', pgClient, lookupPathUser, function(req, res, next) {

  var data = {};
  data.content = {};

  clientQuery(req.pgClient, 'select name from cached_project_versions where userid=$1 group by name',
          [req.pathUser.id])
    .then(function(result) {
      req.pgCloseClient();
      console.log('Insert res', result);
      data.content.projects = result.rows.map(function(project) {
        project.url = '/' + req.pathUser.username + '/' + project.name;
        return project;
      });
      renderPage('User', data, req, res);
    }).catch(next);
});

app.get('/:username/:project', pgClient, lookupPathUser, function(req, res, next) {
  var data = {};
  data.content = {};
  data.content.username = req.params.username;
  data.content.project = req.params.project;

  console.log('USERID', req.pathUser.id)
  console.log('PROJECT', req.params.project)
  clientQuery(req.pgClient, 'select * from cached_project_versions where userid=$1 and name=$2 order by version desc',
          [req.pathUser.id, req.params.project])
    .then(function(result) {
      req.pgCloseClient();
      //console.log('Insert res', result);
      data.content.versions = result.rows.map(function(project) {
        return project.version;
      });
      data.content.readme = result.rows[0].readme;
      data.content.version = result.rows[0].version;
      data.content.downloadPath = 'https://' + S3_BUCKET + '.s3.amazonaws.com/' + req.pathUser.id + '-' + req.params.project + '-' + data.content.version + '.zip'
      renderPage('Project', data, req, res);
    }).catch(next);
});

var port = process.env.PORT || 8080;
app.listen(port, function() {
  console.log("Listening on " + port);
});
