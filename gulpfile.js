var gulp = require('gulp')
  , mainBowerFiles = require('main-bower-files')()
  , gulpFilter = require('gulp-filter')
  , merge = require('merge-stream')
  , concat = require('gulp-concat')
  , uglify = require('gulp-uglify')
  , rename = require('gulp-rename')

gulp.task('default', ['bower', 'volcast', 'bucky'])

gulp.task('bower', function() {

	var jsFilter = gulpFilter('*.js');
	var cssFilter = gulpFilter('*.css', '*.css.map');
	var fontFilter = gulpFilter(['*.eot', '*.woff', '*.woff2', '*.svg', '*.ttf']);

	// main files
	var bower = gulp.src(mainBowerFiles)

		// js
		.pipe(jsFilter)
		.pipe(gulp.dest('dist/js'))
		.pipe(jsFilter.restore())

		// css
		.pipe(cssFilter)
		.pipe(gulp.dest('dist/css'))
		.pipe(cssFilter.restore())

		// fonts
		.pipe(fontFilter)
		.pipe(gulp.dest('dist/fonts'))
		.pipe(fontFilter.restore())

	// bootstrap
	var bootstrap = gulp.src('bower_components/bootstrap/dist/css/bootstrap.css.map')
		.pipe(gulp.dest('dist/css'))

	// jquery-ui
	var jqueryuicss = gulp.src('bower_components/jquery-ui/themes/smoothness/jquery-ui.css')
		.pipe(gulp.dest('dist/css'))

	var jqueryuiimages = gulp.src('bower_components/jquery-ui/themes/smoothness/images/**/*.*')
		.pipe(gulp.dest('dist/css/images'))

	return merge(bower, bootstrap, jqueryuicss, jqueryuiimages)
});

gulp.task('volcast', function() {

	var htmlFilter = gulpFilter('*.html');
	var jsFilter = gulpFilter('*.js');
	var cssFilter = gulpFilter('*.css');

	return gulp.src(['src/*.html', 'src/*.js', 'src/*.css'])

		// html
		.pipe(htmlFilter)
		.pipe(gulp.dest('dist'))
		.pipe(htmlFilter.restore())

		// js
		.pipe(jsFilter)
		.pipe(gulp.dest('dist/js'))
		.pipe(jsFilter.restore())

		// css
		.pipe(cssFilter)
		.pipe(gulp.dest('dist/css'))
		.pipe(cssFilter.restore())
})

gulp.task('bucky', function() {
	return gulp.src('src/bucky.raw')
		.pipe(gulp.dest('dist'))
})