// 1. Navigate to the gulp folder in your terminal
// 2. Run the following command to install the necessary dependencies:
//    npm install gulp browser-sync gulp-notify webpack-stream gulp-dart-sass autoprefixer gulp-sourcemaps cssnano gulp-postcss gulp-rename --save-dev
// 3. Update proxy local URL in line 55 https://UPDATETHIS.test.docker/
// 4. Run the following command to start watching for changes:
//    gulp watch

const gulp = require('gulp');
const browserSync = require('browser-sync').create();
const notify = require('gulp-notify');
const sass = require('gulp-dart-sass');
const autoprefixer = require('autoprefixer');
const sourcemaps = require('gulp-sourcemaps');
const cssnano = require('cssnano');
const postcss = require('gulp-postcss');
const rename = require('gulp-rename');
const webpack = require('webpack-stream');

// var styleSRC     = '../src/sass/*.scss';     // entry points only — compiled by gulp
// var styleWatch   = '../src/sass/**/*.scss';  // all SCSS including partials — watched for changes
// var styleDIST    = '../css/';

var scriptSRC   = './kiddom-scripts.js';     // entry point only — webpack resolves imports
var scriptWatch = ['./kiddom-scripts.js', './modules/**/*.js'];  // all JS including modules — watched for changes
var scriptDIST  = './dist/js/';

// function compileCss() {
//     // Minified CSS
//     return gulp.src(styleSRC)
//         .pipe(sourcemaps.init())
//         .pipe(sass({ outputStyle: 'compressed' }).on('error', sass.logError))
//         .pipe(postcss([
//             autoprefixer({
//                 overrideBrowserslist: ['> 1%', 'last 2 versions', 'IE 11'],
//                 cascade: false
//             }),
//             cssnano()
//         ]))
//         .pipe(rename({ suffix: '.min' }))
//         .pipe(sourcemaps.write('.'))
//         .pipe(gulp.dest(styleDIST))
//         .pipe(browserSync.stream())
//         .pipe(notify({ message: 'Minified CSS compiled', onLast: true }));
// }

// compile bundled js
function jspack() {
    return gulp.src(scriptSRC)
        .pipe( webpack( { mode: "development" } ) )
        .pipe( rename ( { basename: "kiddom-scripts-bundled", extname: ".js"} ) )
        .pipe( gulp.dest(scriptDIST) )
        .pipe(notify({ message: 'JS reloaded', onLast: true }));
}

function watch() {
    browserSync.init({
        proxy: 'https://kiddom-staging.webflow.io/',
        open: false, // do not automatically open browser
        serveStatic: ['.'], // Serve local files
        rewriteRules: [
            {
                // Match raw.githack.com script URL (either unbundled or bundled) and point to local copy
                match: /https:\/\/raw\.githack\.com\/Sulzer-Inc\/kd-2026-scripts\/main\/(kiddom-2026-scripts\.js|dist\/js\/kiddom-scripts-bundled\.js)/g,
                replace: '/dist/js/kiddom-scripts-bundled.js'
            }
        ]
    });
    // gulp.watch(styleWatch, compileCss);
    gulp.watch(scriptWatch, jspack);
    gulp.watch(scriptWatch).on('change', browserSync.reload);
}

exports.watch = watch;
// exports.compileCss = compileCss;
exports.jspack = jspack;