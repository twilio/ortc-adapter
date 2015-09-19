'use strict';

var browserify = require('browserify');
var del = require('del');
var eslint = require('eslint/lib/cli');
var fs = require('fs');
var gulp = require('gulp');
var newer = require('gulp-newer');
var rename = require('gulp-rename');
var replace = require('gulp-replace');
var spawn = require('child_process').spawn;
var source = require('vinyl-source-stream');
var through = require('through2');
var uglify = require('gulp-uglify');
var util = require('gulp-util');

var pkg = require('./package');
var name = pkg.name;
var main = pkg.main;
var version = pkg.version;

var license = 'LICENSE.md';
var linted = '.linted';
var jsdoc = 'node_modules/jsdoc/jsdoc.js';

var lib = 'lib';
var libJsGlob = 'lib/*.js';

var src = 'src';
var srcJs = src + '/' + name + '.js';
var bundleJs = name + '-bundle.js';
var srcBundleJs = src + '/' + bundleJs;

var dist = 'dist';
var js = name + '.js';
var minJs = name + '.min.js';
var distJs = dist + '/' + js;
var distMinJs = dist + '/' + minJs;

var distDocs = dist + '/docs';

gulp.task('default', [distMinJs, distDocs]);

gulp.task('clean', function(done) {
  Promise.all([
    del(dist),
    del(linted),
    del(srcBundleJs)
  ]).then(function() { done() }, done);
});

// Lint
// ----

gulp.task(linted, function(done) {
  lint([libJsGlob, srcJs], newer(linted), function(error, changed) {
    if (error) {
      done(error);
      return;
    } else if (!changed) {
      done();
      return;
    }
    fs.writeFile(linted, '', done);
  });
});

gulp.task('lint', function(done) {
  lint([libJsGlob, srcJs], done);
});

function lint(files) {
  var args = [].slice.call(arguments);
  var filter = args.length === 3 ? args[1] : util.noop();
  var done = args.length === 3 ? args[2] : args[1];
  return gulp.src(files, { read: false })
    .pipe(filter)
    .pipe(then(function(files) {
      if (files.length) {
        var paths = getPaths(files);
        var code = eslint.execute(paths.join(' '));
        if (code) {
          done(new util.PluginError('lint', new Error('ESLint error')));
          return;
        }
      }
      done(null, files.length);
    }));
}

// src/ortc-adapter-bundle.js
// --------------------------

gulp.task(srcBundleJs, function() {
  return gulp.src(libJsGlob, { read: false })
    .pipe(newer(srcBundleJs))
    .pipe(then(function() {
      var b = browserify();
      b.add(main);
      return b.bundle();
    }))
    .pipe(source(bundleJs))
    .pipe(gulp.dest(src));
});

// dist/ortc-adapter.js
// --------------------

gulp.task(distJs, [srcBundleJs], function() {
  return gulp.src(srcBundleJs)
    .pipe(newer(distJs))
    .pipe(then(function(files) {
      var nameRegExp = /\${name}/;
      var versionRegExp = /\${version}/;

      var srcBundleRegExp =
        new RegExp("require\\('\\.\\/" + bundleJs.replace(/.js$/, '') + "'\\);");
      var srcBundleJsContents = files[0].contents;

      var licenseRegExp = new RegExp('#include "' + license + '"');
      var licenseContents;

      return gulp.src(license)
        .pipe(then(function(files) {
          licenseContents = files[0].contents;
          return gulp.src(srcJs)
            .pipe(replace(nameRegExp, name))
            .pipe(replace(versionRegExp, version))
            .pipe(replace(licenseRegExp, licenseContents))
            .pipe(replace(srcBundleRegExp, srcBundleJsContents));
        }));
    }))
    .pipe(rename(js))
    .pipe(gulp.dest(dist));
});

// dist/ortc-adapter.min.js
// -----------------------

gulp.task(distMinJs, [linted, distJs], function() {
  var firstComment = true;
  return gulp.src(distJs)
    .pipe(newer(distMinJs))
    .pipe(uglify({
      preserveComments: function() {
        if (firstComment) {
          firstComment = false;
          return true;
        }
        return false;
      }
    }))
    .pipe(rename(minJs))
    .pipe(gulp.dest(dist));
});

// dist/docs
// ---------

gulp.task(distDocs, function(done) {
  gulp.src([libJsGlob, srcJs], { read: false })
    .pipe(newer(distDocs + '/index.html'))
    .pipe(then(function() {
      del(distDocs).then(function() {
        var child = spawn('node',
          [jsdoc, '-r', lib, '-d', distDocs],
          { stdio: 'inherit' });
        child.on('close', function(code) {
          if (code) {
            done(new util.PluginError('docs', new Error('JSDoc error')));
            return;
          }
          done();
        });
      }, done);
    }));
});

gulp.task('docs', [distDocs]);

function getPaths(files) {
  return files.map(function(file) {
    return file.path;
  });
}

function then(next) {
  var as = [];
  return through.obj(function(a, _, done) {
    as.push(a);
    done();
  }, function(end)  {
    var stream = next(as);
    if (!stream) {
      return end();
    }
    stream.on('data', this.push.bind(this));
    stream.on('end', end);
  });
}
