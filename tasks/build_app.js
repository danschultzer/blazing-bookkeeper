'use strict';

var gulp = require('gulp');
var less = require('gulp-less');
var watch = require('gulp-watch');
var batch = require('gulp-batch');
var exec = require('child_process').exec;
var plumber = require('gulp-plumber');
var jetpack = require('fs-jetpack');
var bundle = require('./bundle');
var utils = require('./utils');
var gutil = require('gulp-util');

var projectDir = jetpack;
var srcDir = jetpack.cwd('./src');
var destDir = jetpack.cwd('./app');

gulp.task('dependencies', function () {
    var rootDir = __dirname + '/..',
        appDir = rootDir + '/app',
        scriptsDir = rootDir + '/scripts',
        buildDir = rootDir + '/build',
        dependencies = ['dependencies', 'poppler', 'opencv', 'tesseract'];

      return dependencies.reduce(function(p, dependency) {
          return p.then(function() {
              return new Promise(function(resolve, reject) {
                  gutil.log("Going to build", gutil.colors.cyan("'" + dependency + "'"));
                  var buildCommand = [
                      'BUILDDIR=' + buildDir,
                      'PKG_CONFIG_PATH=' + buildDir + '/dependencies/lib/pkgconfig',
                      'LDFLAGS=-L' + buildDir + '/dependencies/lib',
                      'CPATH=' + buildDir + '/dependencies/include',
                      'LD_LIBRARY_PATH=' + buildDir + '/dependencies/lib:$LD_LIBRARY_PATH',
                      scriptsDir + '/build-' + dependency + '.sh'].join(' ');
                  gutil.log("Running command", gutil.colors.cyan("'" + buildCommand + "'"));

                  var child = exec(buildCommand, {
                      maxBuffer: 1024 * 1024 * 10
                    },
                    function(error, stdout, stderr) {
                      if (!error) {
                          projectDir.copy(buildDir + '/' + dependency, destDir.path('thirdparty/' + dependency), {
                              overwrite: true
                          });
                          gutil.log("Build of", gutil.colors.cyan("'" + dependency + "'"), "succeeded");
                          resolve();
                      } else {
                        gutil.log("Build of", gutil.colors.cyan("'" + dependency + "'"), "failed");
                          reject();
                          throw error;
                      }
                  });
                  child.stdout.pipe(process.stdout);
                  child.stderr.pipe(process.stdout);
              });
          });
      }, Promise.resolve());
});

gulp.task('bundle', function () {
    return Promise.all([
        bundle(srcDir.path('background.js'), destDir.path('background.js')),
        bundle(srcDir.path('app.js'), destDir.path('app.js')),
        bundle(srcDir.path('edit.js'), destDir.path('edit.js')),
    ]);
});

gulp.task('less', function () {
    return gulp.src(srcDir.path('stylesheets/main.less'))
        .pipe(plumber())
        .pipe(less())
        .pipe(gulp.dest(destDir.path('stylesheets')));
});

gulp.task('environment', function () {
    var configFile = 'config/env_' + utils.getEnvName() + '.json';
    projectDir.copy(configFile, destDir.path('env.json'), { overwrite: true });
});

gulp.task('watch', function () {
    var beepOnError = function (done) {
        return function (err) {
            if (err) {
                utils.beepSound();
            }
            done(err);
        };
    };

    watch('src/**/*.js', batch(function (events, done) {
        gulp.start('bundle', beepOnError(done));
    }));
    watch('src/**/*.less', batch(function (events, done) {
        gulp.start('less', beepOnError(done));
    }));
});

gulp.task('build', ['dependencies', 'bundle', 'less', 'environment']);
