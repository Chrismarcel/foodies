const gulp = require("gulp");
const responsiveimages = require("gulp-responsive-images");
const imagemin = require("gulp-imagemin");
const imageminMozjpeg = require("imagemin-mozjpeg");

gulp.task("compressImg", () =>
  gulp
    .src("./img/*.jpg")
    .pipe(imagemin([imageminMozjpeg({ quality: 80 })]))
    .pipe(gulp.dest("./img/"))
);

gulp.task("resizeImages", function() {
  gulp
    .src("./img/*.jpg")
    .pipe(
      responsiveimages({
        "*.jpg": [
          {
            width: 350,
            suffix: "-small"
          },
          {
            width: 500,
            suffix: "-medium"
          }
        ]
      })
    )
    .pipe(gulp.dest("./img/"));
});
