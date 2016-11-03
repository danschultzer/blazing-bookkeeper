'use strict';

var gulp = require('gulp');
var less = require('gulp-less');
var watch = require('gulp-watch');
var batch = require('gulp-batch');
var plumber = require('gulp-plumber');
var gutil = require('gulp-util');
var exec = require('child_process').exec;
var jetpack = require('fs-jetpack');
var bundle = require('./bundle');
var utils = require('./utils');

var projectDir = jetpack;
var srcDir = jetpack.cwd('./src');
var destDir = jetpack.cwd('./app');

gulp.task('dependencies', function() {
    var rootDir = jetpack.cwd('./').path(),
        platform = process.platform,
        buildScript = jetpack.cwd('./scripts').path('build/' + platform + '/build.sh'),
        buildDir = rootDir + '/build',
        buildDestDir = rootDir + '/thirdparty';

      return new Promise(function(resolve, reject) {
          if (!jetpack.exists(buildScript)) {
            gutil.log('No build file for', `'${gutil.colors.cyan(platform)}'`);
            return resolve();
          }

          gutil.log('Going to build for', `'${gutil.colors.cyan(platform)}'`);

          var buildCommand = [
            'BUILDDIR=' + buildDir,
            'THIRDPARTYDIR=' + buildDestDir,
            'sh ' + buildScript,
          ].join(' ');
          var child = exec(buildCommand, {
              maxBuffer: 1024 * 1024 * 10
            },
            function(error, stdout, stderr) {
              if (!error) {
                  gutil.log('Build succesful');
                  resolve();
              } else {
                  gutil.log('Build failed');
                  reject();
                  throw error;
              }
          });
          child.stdout.pipe(process.stdout);
          child.stderr.pipe(process.stderr);
          return child;
      });
});

gulp.task('bundle', function() {
    return Promise.all([
        bundle(srcDir.path('background.js'), destDir.path('background.js')),
        bundle(srcDir.path('app.js'), destDir.path('app.js')),
        bundle(srcDir.path('edit.js'), destDir.path('edit.js')),
        bundle(srcDir.path('report.js'), destDir.path('report.js')),
    ]);
});

gulp.task('less', function() {
    return gulp.src(srcDir.path('stylesheets/main.less'))
        .pipe(plumber())
        .pipe(less())
        .pipe(gulp.dest(destDir.path('stylesheets')));
});

gulp.task('environment', function() {
    var configFile = 'config/env_' + utils.getEnvName() + '.json';
    projectDir.copy(configFile, destDir.path('env.json'), { overwrite: true });
});

gulp.task('watch', function() {
    var beepOnError = function(done) {
        return function(err) {
            if (err) {
                utils.beepSound();
            }
            done(err);
        };
    };

    watch('src/**/*.js', batch(function(events, done) {
        gulp.start('bundle', beepOnError(done));
    }));
    watch('src/**/*.less', batch(function(events, done) {
        gulp.start('less', beepOnError(done));
    }));
});

gulp.task('build', ['dependencies', 'bundle', 'less', 'environment']);
