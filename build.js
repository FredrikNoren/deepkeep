var fs = require('fs');
var path = require('path');
var less = require('less');
var UglifyJS = require('uglify-js');
var browserify = require('browserify');
var streamToBuffer = require('stream-to-buffer');
require('node-jsx').install({extension: '.jsx', harmony: true });

(function createBundlejs() {
  var b = browserify();
  var browserifyArgs = fs.readdirSync('components').map(function(component) {
    console.log('Adding', './components/' + component)
    b.require('./components/' + component, { entry: false, expose: component.substring(0, component.length - '.jsx'.length) });
  });
  b.require('react');
  b.transform('reactify', { es6: true });
  b.transform('brfs');
  streamToBuffer(b.bundle(), function(err, buffer) {
    if (err) {
      console.log(err);
      return reject(err);
    }
    var bundle = buffer.toString();
    console.log('Bundle created');
    if (!process.env.DEVELOP) {
      var result = UglifyJS.minify(bundle, {fromString: true});
      console.log('Bundle minified');
      bundle = result.code;
    }
    console.log("\007");
    fs.writeFileSync('static/bundle.js', bundle);
  });
})();

(function createBundlecss() {
  var source = fs.readdirSync('components').map(function(component) {
    var c = require('./components/' + component);
    return c.styles || '';
  }).join('\n');
  source += '\n' + fs.readFileSync('styles.less');

  less.render(source, { filename: path.resolve('./styles.less') }, function(error, output) {
    if (error) {
      fs.writeFileSync('tmp.error.less', source);
      console.log(error);
      process.exit();
    }
    console.log('Less compiled')
    fs.writeFileSync('static/styles.css', output.css);
  });
})();
