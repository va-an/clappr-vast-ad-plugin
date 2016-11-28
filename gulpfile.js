var gulp = require('gulp');
var babel = require('gulp-babel');
var concat = require('gulp-concat');
var del = require('del');
var runSequence = require('run-sequence').use(gulp);

var bundle_js = ['src/cvap.js', 'src/vast-client.js']

function swallowError (error) {
    console.log(error.toString());
    this.emit('end');
}

gulp.task('bundle_js', function() {
  return gulp.src(bundle_js)
    .pipe(babel({presets: ['es2015']}))
    .pipe(concat('cvapg.js'))
    .pipe(gulp.dest('dist'));
});

gulp.task('bundle', ['bundle_js']);
gulp.task('compile', function() {
  return runSequence('bundle');
});

gulp.task('default', ['compile']);

