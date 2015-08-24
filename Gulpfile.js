var gulp = require('gulp'),
    coffee = require('gulp-coffee'),
    sourcemaps = require('gulp-sourcemaps'),
    uglify = require('gulp-uglify');

gulp.task('coffee', function () {
    gulp.src('./*.coffee')
        .pipe(sourcemaps.init())
        .pipe(coffee({bare: true}))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('./compiled/'))
});

gulp.task('default', ['coffee']);
