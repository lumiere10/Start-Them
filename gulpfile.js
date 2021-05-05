let preprocessor = 'sass', // Preprocessor (sass, less, styl); 'sass' also work with the Scss syntax in blocks/ folder.
	fileswatch = 'html,htm,txt,json,md,woff2,php,js' // List of files extensions for watching & hard reload

const { src, dest, parallel, series, watch } = require('gulp')
const browserSync = require('browser-sync').create()
const bssi = require('browsersync-ssi')
const ssi = require('ssi')
const webpack = require('webpack-stream')
const sass = require('gulp-sass')
const sassglob = require('gulp-sass-glob')
const less = require('gulp-less')
const lessglob = require('gulp-less-glob')
const styl = require('gulp-stylus')
const stylglob = require("gulp-noop")
const cleancss = require('gulp-clean-css')
const autoprefixer = require('gulp-autoprefixer')
const rename = require('gulp-rename')
const imagemin = require('gulp-imagemin')
const newer = require('gulp-newer')
const rsync = require('gulp-rsync')
const del = require('del')
const webp = require('gulp-webp')
const webphtml = require('gulp-webp-html')
const webpcss = require('gulp-webp-css')

function browsersync() {
	browserSync.init({
		proxy: "http://test.local",
		host: "test.local",
		open: "external",
	})
}

function html() {
	return src(['app/../*.php', 'app/../*.html'])
		.pipe(webphtml())
		.pipe(browserSync.stream())
		.pipe(dest('app/../'))
}

function scripts() {
	return src(['app/js/*.js', '!app/js/*.min.js'])
		.pipe(webpack({
			mode: 'production',
			performance: { hints: false },
			module: {
				rules: [
					{
						test: /\.(js)$/,
						exclude: /(node_modules)/,
						loader: 'babel-loader',
						query: {
							presets: ['@babel/env'],
							plugins: ['babel-plugin-root-import']
						}
					}
				]
			}
		})).on('error', function handleError() {
			this.emit('end')
		})
		.pipe(rename('main.js'))
		.pipe(dest('app/../js'))
		.pipe(browserSync.stream())
}
function script() {
	return src('app/../js/*.js')
		.pipe(browserSync.stream())
}

function styles() {
	return src([`app/${preprocessor}/*.*`, `!app/${preprocessor}/_*.*`])
		.pipe(eval(`${preprocessor}glob`)())
		.pipe(eval(preprocessor)())
		.pipe(webpcss())
		.pipe(autoprefixer({ overrideBrowserslist: ['last 10 versions'], grid: true }))
		.pipe(cleancss({ level: { 1: { specialComments: 0 } }, /* format: 'beautify' */ }))
		//.pipe(rename({ suffix: ".min" }))
		.pipe(dest('app/../'))
		.pipe(browserSync.stream())
}

function imagesWebP() {
	return src(['app/img/**/*'])
		.pipe(newer('images/**/*'))
		.pipe(
			webp({
				quality: 70
			})
		)
		.pipe(dest('images/'))
		.pipe(browserSync.stream())
}

function images() {
	return src(['app/img/**/*'])
		.pipe(newer('images/**/*'))
		.pipe(
			imagemin({
				progressive: true,
				svgoPluginus: [{ removeVievBox: false }],
				interlaced: true,
				optimizationLevel: 3,
			})
		)
		.pipe(dest('images/'))
		.pipe(browserSync.stream())
}
function buildcopy() {
	return src([
		'{app/js,app/css}/*.min.*',
		'app/images/**/*.*',
		'!app/images/src/**/*',
		'app/fonts/**/*'
	], { base: 'app/' })
		.pipe(dest('dist'))
}

async function buildhtml() {
	let includes = new ssi('app/', 'dist/', '/**/*.html')
	includes.compile()
	del('dist/parts', { force: true })
}

function cleandist() {
	return del('dist/**/*', { force: true })
}

function deploy() {
	return src('dist/')
		.pipe(rsync({
			root: 'dist/',
			hostname: 'username@yousite.com',
			destination: 'yousite/public_html/',
			// clean: true, // Mirror copy with file deletion
			include: [/* '*.htaccess' */], // Included files to deploy,
			exclude: ['**/Thumbs.db', '**/*.DS_Store'],
			recursive: true,
			archive: true,
			silent: false,
			compress: true
		}))
}

function startwatch() {
	watch(`app/${preprocessor}/**/*`, { usePolling: true }, styles)
	watch(['app/js/**/*.js', '!app/js/**/*.min.js'], { usePolling: true }, scripts)
	watch('app/img/**/*.{jpg,jpeg,png,webp,svg,gif}', { usePolling: true }, images)
	watch(`**/*.{${fileswatch}}`, { usePolling: true }).on('change', browserSync.reload)
}


exports.script = script
exports.html = html
exports.scripts = scripts
exports.styles = styles
exports.imagesWebP = imagesWebP
exports.images = images
exports.deploy = deploy
exports.assets = series(scripts, styles, imagesWebP, images)
exports.build = series(cleandist, scripts, styles, images, buildcopy, buildhtml)
exports.default = series(html, scripts, styles, imagesWebP, images, parallel(browsersync, startwatch))
