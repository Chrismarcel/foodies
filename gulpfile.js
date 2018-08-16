const gulp = require('gulp');
const responsiveimages = require('gulp-responsive-images');

gulp.task('optimizeImage', function () {
    gulp.src('./img/*.jpg')
        .pipe(responsiveimages({
            '*.jpg': [
                {
                    width: 350,
                    suffix: '-small'
                },
                {
                    width: 500,
                    suffix: '-medium'
                },
                {
                    width: 800,
                    suffix: '-large'
                }
            ]
        }))
        .pipe(gulp.dest('./img/'));
});