var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var spritesmith = require('gulp.spritesmith');
var del = require('del');
var browserSync = require('browser-sync');
var runSequence = require('run-sequence');
var reload = browserSync.reload;

// basic paths setting
var paths = {
  src : 'assets',
  tmp : '.tmp',
  build : 'build'
};

// clean
gulp.task('clean', function (cb) {
  del(paths.tmp, cb);
});

// ect
gulp.task('ect', function() {
  return gulp.src(paths.src + '/templates/*.ect')
    .pipe($.ect({data: function (filename, cb) {
      console.log(filename);
      cb({foo: require('./assets/data/bar.json')});
    }}))
    .pipe(gulp.dest(paths.tmp))
    .pipe(reload({stream:true}));
});

// js
gulp.task('js', function(){
  return gulp.src(paths.src + '/js/**/*.js')
    .pipe($.plumber())
    .pipe(gulp.dest(paths.tmp + '/js/'))
    .pipe(reload({stream:true}));
});

// sass
gulp.task('sass', function(){
  return gulp.src(paths.src + '/scss/**/*.scss')
    .pipe($.plumber())
    .pipe($.sass())
    .pipe($.autoprefixer({
      browsers: ['last 2 versions'],
      cascade: true
    }))
    .pipe(gulp.dest(paths.tmp + '/css/'))
    .pipe(reload({stream:true}));
});

// sprite
gulp.task('sprite', function () {
  var spriteData = gulp.src(paths.src + '/img/sprite/*.png').pipe(spritesmith({
    imgName: 'sprite.png',
    cssName: '_sprite.scss',
    imgPath: '../img/sprite.png'
  }));
  spriteData.img.pipe(gulp.dest(paths.tmp + '/img/'));
  spriteData.css.pipe(gulp.dest(paths.src + '/scss/var/'));
});

// img
gulp.task('img', ['sprite'], function() {
  return gulp.src([
    paths.src + '/img/**/',
    '!' + paths.src + '/img/sprite/'
  ]).pipe(gulp.dest(paths.tmp + '/img/'));
});

// build-clean
gulp.task('build-clean', function (cb) {
  del(paths.build, cb);
});

// build-html
gulp.task('build-html', function() {
  var assets = $.useref.assets();

  return gulp.src(paths.tmp + '/**/*.html')
    .pipe(assets)
    .pipe($.if('*.js', $.uglify()))
    .pipe($.if('*.css', $.minifyCss()))
    .pipe(assets.restore())
    .pipe($.useref())
    .pipe(gulp.dest(paths.build));
});

// build-img
gulp.task('build-img', function() {
  return gulp.src([
    paths.tmp + '/img/**',
    '!' + paths.tmp + '/img/sprite'
  ]).pipe($.imagemin({
      progressive: true,
      interlaced: true
    }))
    .pipe(gulp.dest(paths.build + '/img/'))
    .pipe($.size({title: 'images'}));
});

// server
gulp.task("server", function() {
  browserSync({
    server: {
      baseDir: paths.tmp
    }
  });
});

// watch
gulp.task('watch', ['server'], function(){
  gulp.watch([paths.src +'/**/*.ect'], ['ect']);
  gulp.watch([paths.src +'/js/**/*.js'], ['js']);
  gulp.watch([paths.src +'/scss/**/*.scss'], ['sass']);
});

// default
gulp.task('default', ['clean'], function() {
  runSequence(
    'img',
    ['ect', 'js', 'sass','watch']
  );
});

// build
gulp.task('build', ['build-clean'], function() {
  runSequence(
    'img',
    ['ect', 'js', 'sass'],
    ['build-html', 'build-img']
  );
});
