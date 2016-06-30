'use strict';

var gulp = require('gulp');

var $ = require('gulp-load-plugins')({
  pattern: ['gulp-*', 'main-bower-files', 'uglify-save-license', 'del']
});

module.exports = function(options) {
  gulp.task('partials', function () {
    return gulp.src([
      options.src + '/app/**/*.html',
      options.tmp + '/serve/app/**/*.html'
    ])
      .pipe($.minifyHtml({
        empty: true,
        spare: true,
        quotes: true
      }))
      .pipe($.angularTemplatecache('templateCacheHtml.js', {
        module: 'stats',
        root: 'app'
      }))
      .pipe(gulp.dest(options.tmp + '/partials/'));
  });

  gulp.task('html', ['inject', 'partials'], function () {
    var partialsInjectFile = gulp.src(options.tmp + '/partials/templateCacheHtml.js', { read: false });
    var partialsInjectOptions = {
      starttag: '<!-- inject:partials -->',
      ignorePath: options.tmp + '/partials',
      addRootSlash: false
    };

    var htmlFilter = $.filter('*.html', { restore: true });
    var jsFilter = $.filter('*.js', { restore: true });
    var cssFilter = $.filter('**', { restore: true });
    var indexHtmlFilter = $.filter(['**/*', '!**/index.html'], { restore: true });

    return gulp.src(options.tmp + '/serve/*.html')
      .pipe($.inject(partialsInjectFile, partialsInjectOptions))
      .pipe($.useref())
      .pipe($.if('*.js', $.ngAnnotate()))
      .pipe($.if('*.js', $.uglify({ preserveComments: $.uglifySaveLicense })).on('error', options.errorHandler('Uglify')))
      .pipe($.if('*.css',$.replace('../../bower_components/bootstrap-sass-official/assets/fonts/bootstrap/', '../fonts/')))
      .pipe($.if('*.css', $.csso()))
      .pipe($.if('*.html', $.minifyHtml({
        empty: true,
        spare: true,
        quotes: true,
        removeComments: true,
        collapseWhitespace: true,
        conservativeCollapse: true,
        conditionals: true
      })))
      .pipe($.if(['**/*.js', '**/*.css'], $.rev()))
      .pipe($.revReplace())
      .pipe(gulp.dest(options.dist + '/'))
      .pipe($.size({ title: options.dist + '/', showFiles: true }));
  });

  // Only applies for fonts from bower dependencies
  // Custom fonts are handled by the "other" task
  gulp.task('fonts', function () {
    return gulp.src($.mainBowerFiles())
      .pipe($.filter('**/*.{eot,svg,ttf,woff,woff2}'))
      .pipe($.flatten())
      .pipe(gulp.dest(options.dist + '/fonts/'));
  });

  gulp.task('other', function () {
    return gulp.src([
      options.src + '/**/*',
      '!' + options.src + '/**/*.{html,css,js,scss}'
    ])
      .pipe(gulp.dest(options.dist + '/'));
  });

  gulp.task('clean', function (done) {
    $.del([options.dist + '/', options.tmp + '/'], done);
  });

  gulp.task('build', ['html', 'fonts', 'other']);
};
