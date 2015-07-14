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
var UglifyJS = require('uglify-js');
var AdmZip = require('adm-zip');
var browserify = require('browserify');
var compression = require('compression');
var auth = require('basic-auth');
var aws = require('aws-sdk');
var streamToBuffer = require('stream-to-buffer');
var uuid = require('uuid');
var pg = require('pg');
var elasticsearch = require('elasticsearch');
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

app.use('/static', express.static('static'));

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
queries.allProjects = new PartialQuery('select userid, projectname, username from cached_project_versions group by userid, projectname, username');
queries.countAllProject = new PartialQuery('select count(*) as nprojects from ($[allProjects]) as allprojects', { allProjects: queries.allProjects });

function FSStorage(app) {
  if (!fs.existsSync('storage')) fs.mkdirSync('storage');
  app.use('/storage', express.static('storage'));
}
FSStorage.prototype.exists = function(key) {
  return Promise.resolve(fs.existsSync(path.join('storage', key)));
}
FSStorage.prototype.upload = function(key, stream) {
  return new Promise(function(resolve, reject) {
    var f = fs.createWriteStream(path.join('storage', key));
    stream.pipe(f).on('close', function() {
      resolve();
    });
  });
}
FSStorage.prototype.urlForKey = function(key) {
  return '/storage/' + encodeURIComponent(key);
}
function S3Storage() {
  var AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY;
  var AWS_SECRET_KEY = process.env.AWS_SECRET_KEY;
  this.S3_BUCKET = process.env.S3_BUCKET;
  aws.config.update({ accessKeyId: AWS_ACCESS_KEY, secretAccessKey: AWS_SECRET_KEY });
  this.s3 = new aws.S3({ params: { Bucket: this.S3_BUCKET }});
}
S3Storage.prototype.exists = function(key) {
  return new Promise(function(resolve, reject) {
    this.s3.headObject({ Key: key }, function(err, headRes) {
      resolve(headRes || err.code !== 'NotFound');
    });
  }.bind(this));
}
S3Storage.prototype.upload = function(key, stream) {
  return new Promise(function(resolve, reject) {
    var s3obj = new aws.S3({
      params: {
        Bucket: this.S3_BUCKET,
        Key: key,
        ACL: 'public-read'
      }
    });
    s3obj.upload({ Body: stream }).
      on('httpUploadProgress', function(evt) { console.log(evt); }).
      send(function(err, data) {
        if (err) reject(err);
        else resolve(data);
      });
  }.bind(this));
}
S3Storage.prototype.urlForKey = function(key) {
  return 'https://' + this.S3_BUCKET + '.s3.amazonaws.com/' + encodeURIComponent(key);
}
var storage;
if (process.env.AWS_ACCESS_KEY) storage = new S3Storage();
else storage = new FSStorage(app);

app.get('/', pgClient, function(req, res, next) {

  var data = {};
  data.content = {};
  data.content.isLoggedIn = !!req.user;
  data.content.host = req.headers.host;
  data.logoMuted = true;

  clientQuery(req.pgClient, queries.countAllProject.toQuery())
    .then(function(result) {
      data.content.nprojects = result.rows[0].nprojects;
      renderPage('Home', data, req, res);
      req.pgCloseClient();
    }).catch(next);
});

app.get('/all', pgClient, function(req, res, next) {

  var data = {};
  data.content = {};
  data.content.isLoggedIn = !!req.user;
  data.content.title = 'All Projects';

  clientQuery(req.pgClient, queries.allProjects.toQuery())
    .then(function(result) {
      data.content.projects = result.rows.map(function(project) {
        project.url = '/' + project.username + '/' + project.projectname;
        return project;
      });
      renderPage('List', data, req, res);
      req.pgCloseClient();
    }).catch(next);
});

app.get('/search', esClient, function(req, res, next) {
  // TODO falcon: pagination
  req.esClient.search({
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
    var data = {};
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
    renderPage('List', data, req, res);
  }, function (err) {
    console.log('search failed', err);
    renderPage('Error', {content: {message: 'Search failed.'}}, req, res);
  });
});

app.get('/favicon.ico', function(req, res) {
  res.status(404).send('Not found');
});

app.post('/api/v1/upload', multer({ dest: './uploads/' }), pgClient, esClient, function(req, res, next) {
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
        .then(function() {
          return clientQuery(req.pgClient, 'insert into cached_project_versions (userid, projectname, version, username, readme) values ($1, $2, $3, $4, $5)',
                  [stormpathUser.id, packageJson.name, packageJson.version, stormpathUser.username, readme])
            .then(function(result) {
              console.log('DONE', result);
              req.pgCloseClient();
              // add the username for consistency
              packageJson.username = user.name;
              req.esClient.index({
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
                res.send('OK');
              });
            });
        });
    }).catch(next);
  });
});



function lookupPathUser(req, res, next) {
  req.app.get('stormpathApplication').getAccounts({ username: req.params.username }, function(err, accounts) {
    if (err || !accounts || accounts.size == 0) {
      return renderPage('Error', {content: {message: 'Unknown user.'}}, req, res);
    }
    req.pathUser = accounts.items[0];
    req.pathUser.id = stormpathUserHrefToId(req.pathUser.href);
    next();
  });
}

function stormpathUserHrefToId(href) {
  return href.substring('https://api.stormpath.com/v1/accounts/'.length);
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

function esClient(req, res, next) {
  req.esClient = new elasticsearch.Client({
    host: process.env.BONSAI_URL || 'localhost:9200'
  });
  next();
}

app.get('/:username', pgClient, lookupPathUser, function(req, res, next) {

  var data = {};
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
      renderPage('User', data, req, res);
    }).catch(next);
});

function renderProject(req, res, next) {
  var data = {};
  data.content = {};
  data.content.username = req.params.username;
  data.content.project = req.params.project;
  data.content.host = req.headers.host;

  console.log('USERID', req.pathUser.id)
  console.log('PROJECT', req.params.project)
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
      renderPage('Project', data, req, res);
    }).catch(function() {
      renderPage('Error', {content: {message: 'Unknown project.'}}, req, res);
    });
}

app.get('/:username/:project', pgClient, lookupPathUser, renderProject);

app.get('/:username/:project/package.zip', pgClient, lookupPathUser, function(req, res, next) {
  clientQuery(req.pgClient, 'select * from cached_project_versions where userid=$1 and projectname=$2 order by version desc limit 1',
          [req.pathUser.id, req.params.project])
    .then(function(result) {
      req.pgCloseClient();
      res.redirect('/' + req.params.username + '/' + req.params.project + '/' + result.rows[0].version + '/package.zip');
    }).catch(function() {
      renderPage('Error', {content: {message: 'Unknown project.'}}, req, res);
    });
});

app.get('/:username/:project/:version', pgClient, lookupPathUser, renderProject);

app.get('/:username/:project/:version/package.zip', lookupPathUser, function(req, res, next) {
  var key = req.pathUser.id + '-' + req.params.project + '-' + req.params.version + '.zip';
  res.redirect(storage.urlForKey(key));
});

var port = process.env.PORT || 8080;
app.listen(port, function() {
  console.log("Listening on " + port);
});
