var gulp = require('gulp');
var browserify = require('browserify');
var babelify = require('babelify');
var source = require('vinyl-source-stream');

//
// Added to support less
//
var less = require('gulp-less');
var path = require('path');
var rename = require('gulp-rename');

// 
// Added to support bower
//
var bower = require('gulp-bower');

//
// To concat files
//
var concat = require('gulp-concat');




///////////////////////////////////////////////////////
//
// "Bower" tasks
//
// NOTE: For this simple app, we aren't using anything downloaded via bower.
//
///////////////////////////////////////////////////////



//
// Run bower to grab all bower components.
//
//gulp.task('bower', function() {
//  return bower();
//});



///////////////////////////////////////////////////////
//
// Images used by the entire application
//
///////////////////////////////////////////////////////


gulp.task('copyimages', function() {
   gulp.src(
      [
         './client/favicon.ico'
      ]
   )
   .pipe(gulp.dest('./server/public'));
});



///////////////////////////////////////////////////////
//
// The common styles used on all pages
//
///////////////////////////////////////////////////////


gulp.task('less:common', function () {
  return gulp.src('./client/less/common.less')
    .pipe(less({
      paths: [ path.join(__dirname, 'client', 'less', 'includes') ]
    }))
    .pipe(rename('common.css'))
    .pipe(gulp.dest('./server/public/css'));
});




///////////////////////////////////////////////////////
//
// The "home" page
//
///////////////////////////////////////////////////////


gulp.task('buildall:index', ['build:index','build:indexWorker','less:index']);

gulp.task('build:index', function () {
    return browserify({
            entries: './client/jsx/views/indexView.jsx', 
            extensions: ['.jsx'], debug: true
         })
        .transform(babelify)
        .bundle()
        .pipe(source('index.js'))
        .pipe(gulp.dest('server/public/js/views'));
});

gulp.task('build:indexWorker', function () {
    return browserify({
            entries: './client/js/webWorkers/indexWebWorker.js', 
            extensions: ['.js'], debug: true
         })
        .transform(babelify)
        .bundle()
        .pipe(source('indexWebWorker.js'))
        .pipe(gulp.dest('server/public/js/webWorkers'));
});

gulp.task('less:index',['less:common'], function () {
  return gulp.src('./client/less/views/index.less')
    .pipe(less({
      paths: [ path.join(__dirname, 'client', 'less', 'includes') ]
    }))
    .pipe(rename('index.css'))
    .pipe(gulp.dest('./server/public/css/views'));
});





gulp.task('buildall',[
   'copyimages',
   'buildall:index',
]);


gulp.task('watch', [
     'copyimages',
     'buildall:index',
  ], function () {


      ///////////////////////////////////////////////////////
      //
      // The "common" LESS
      //
      ///////////////////////////////////////////////////////

      gulp.watch([
           './client/less/common.less',
           './client/less/includes/*.less'], 
         ['less:common']);


      ///////////////////////////////////////////////////////
      //
      // The "Index" page
      //
      ///////////////////////////////////////////////////////

      gulp.watch(['./client/jsx/views/indexView*.jsx','./client/jsx/components/*.jsx'], 
         ['build:index']);

      gulp.watch(['./client/js/webWorkers/indexWebWorker.js'], 
         ['build:indexWorker']);

      gulp.watch('./client/less/views/index.less', ['less:index']);

});

gulp.task('default', ['watch']);



