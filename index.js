var fs = require('fs');
var path = require('path');
var express = require('express');
var session = require('express-session');
var flash = require('connect-flash');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var async = require('async');
var moment = require('moment');
var merge = require('merge');
var less = require('less');
var browserify = require('browserify');
var streamToBuffer = require('stream-to-buffer');
var uuid = require('uuid');
var pg = require('pg');
var React = require('react');
require('node-jsx').install({extension: '.jsx', harmony: true });

var app = express();

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



var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(userId, done) {
  pg.connect(DATABASE_URL, function(err, client, closeClient) {
    if (err) console.log('Connection error', err);
    client.query('select * from users where id=$1', [userId], function(err, result) {
      if (result.rows.length > 0) {
        closeClient();
        done(null, result.rows[0]);
        return;
      } else {
        done(null, false);
      }
    });
  });
});

passport.use(new FacebookStrategy({
    clientID: '826007657490242',
    clientSecret: '7b4087305907faef40cca09eb845de5c',
    callbackURL: 'http://localhost:8080/auth/facebook/callback',
    profileFields: ['id', 'displayName', 'photos']
  },
  function(accessToken, refreshToken, profile, done) {
    pg.connect(DATABASE_URL, function(err, client, closeClient) {
      if (err) console.log('Connection error', err);
      client.query('select * from users where id=$1', [profile.id], function(err, result) {
        if (err) console.log('Query error', err);
        if (result.rows.length > 0) {
          closeClient();
          done(null, result.rows[0]);
          return;
        }
        client.query('insert into users (id, display_name, profile_image_url) values ($1, $2, $3)', [profile.id, profile.displayName, profile.photos[0].value], function(err, result) {
          closeClient();
          if (err) console.log('Query error', err);
          client.query('select * from users where id=$1', [profile.id], function(err, result) {
            done(null, result.rows[0]);
          });
        });
      });
    });
  }
));

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({ secret: 'distillied', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());
app.use('/static', express.static(__dirname + '/static'));

app.get('/auth/facebook', passport.authenticate('facebook'));
app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { successRedirect: '/',
                                      failureRedirect: '/login' }));

// app.use(flash());
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

function pgQuery(sql, params) {
  return new Promse(function(resolve, reject) {
    pg.connect(DATABASE_URL, function(err, client, closeClient) {
      if (err) return reject(err);
      client.query('insert into dna (sequence) values ($1)', ['lol'], function(err, result) {
        closeClient();
        if (err) return reject(err);
        console.log('Res', result);
        client.query('select * from dna', function(err, result) {
          if (err) console.log('Query error', err);
          console.log('Res', result);
          res.json(result.rows);
          closeClient();
        });
      });
    });
  });
}

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
  if (req.isAuthenticated()) {
    data.profileImage = req.user.profile_image_url;
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


app.get('/', function(req, res) {

  var data = {};
  data.content = {}
  data.content.isLoggedIn = req.isAuthenticated();
  data.logoMuted = true;

  renderPage('Home', data, req, res);
});

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

app.listen(8080);
