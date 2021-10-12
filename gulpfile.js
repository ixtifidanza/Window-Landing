"use strict";

let fs = require('fs');

const {src, dest} = require("gulp");
const gulp = require("gulp");
const autoprefixer = require("gulp-autoprefixer");
const cssbeautify = require("gulp-cssbeautify");
const cssnano = require("gulp-cssnano");
const imagemin = require("gulp-imagemin");
const plumber = require("gulp-plumber");
const rename = require("gulp-rename");
const include = require('gulp-file-include');
const concat = require('gulp-concat');
const sass = require("gulp-sass");
const group_media = require('gulp-group-css-media-queries'); // Для адаптив 
const removeComments = require("gulp-strip-css-comments");
const uglify = require("gulp-uglify");
const del = require("del");
const ttf2woff = require('gulp-ttf2woff'); // ttf to woff
const ttf2woff2 = require('gulp-ttf2woff2'); // ttf to woff2
const fonter = require('gulp-fonter'); // otf to ttf
const browsersync = require("browser-sync").create();


// Path

var path = {
    build: {
        html: "dist/",
        js: "dist/assets/js/",
        css: "dist/assets/css/",
        images: "dist/assets/img/",
        fonts: "dist/assets/fonts/"
    },
    src: {
        html: "src/*.html",
        js: "src/assets/js/*.js",
        css: "src/assets/scss/style.{scss, sass}",
        images: "src/assets/img/**/*.{png,ico,jpg,svg,gif}",
        fonts: 'src//assets/fonts/*.{ttf, woff, woff2}'
    },
    watch: {
        html: "src/**/*.html",
        js: "src/assets/js/**/*.js",
        css: "src/assets/scss/**/*.{scss,sass}",
        images: "src/assets/img/**/*.{png,ico,jpg,svg,gif}"
    },
    clean: "./dist"
}


// Tasks

function browserSync(done) {
    browsersync.init({
        server: {
            baseDir: "./dist"
        },
        port: 3000,
        notify: false
    });
}

function browserSyncReload(done) {
    browsersync.reload();
}

function html() {
    return src(path.src.html, { base: "src/" })
        .pipe( plumber() )
        .pipe( dest(path.build.html) )
        .pipe( browsersync.stream() );
}

function css() {
    return src(path.src.css, { base: "src/assets/scss/" })
        .pipe( plumber() )
        .pipe( sass() )
        .pipe( group_media() )
        .pipe( autoprefixer({
            overrideBrowserslist: ['last 8 versions'],
            cascade: true
        }))
        .pipe( cssbeautify() )
        .pipe( dest(path.build.css) )
        .pipe( cssnano({
            zindex: false,
            discardComments: {
                removeAll: true
            }
        }))
        .pipe( removeComments() )
        .pipe( rename({
            suffix: ".min",
            extname: ".css"
        }))
        .pipe( dest(path.build.css) )
        .pipe( browsersync.stream() );
}

function libsCss() {
    return gulp.src([ //указываем, где брать исходники
        'node_modules/normalize.css/normalize.css',
        'node_modules/flexboxgrid2/flexboxgrid2.css',
        'node_modules/pagepiling.js/dist/jquery.pagepiling.css',
        // 'node_modules/swiper/swiper-bundle.min.css',
        // 'node_modules/bootstrap/dist/css/bootstrap.min.css',
        // 'node_modules/font-awesome/css/font-awesome.css',
        // 'node_modules/wowjs/css/libs/animate.css',
        // 'node_modules/animate.css/animate.css',
        // 'node_modules/slick-carousel/slick/slick.css',
        // 'node_modules/slick-carousel/slick/slick-theme.css'
        // 'node_modules/magnific-popup/dist/magnific-popup.css',
    ])
    .pipe(concat('libs.min.css')) //склеиваем их в один файл с указанным именем
    .pipe(
        cssnano({
        zindex: false,
        discardComments: {
            removeAll: true
        }
    })
    )
    .pipe(removeComments())
    .pipe(gulp.dest(path.build.css))
}

function js() {
    return src(path.src.js, { base: "./src/assets/js/" })
        .pipe( plumber() )
        .pipe( include() )
        .pipe( gulp.dest(path.build.js) )
        .pipe( uglify() )
        .pipe( rename({
            suffix: ".min",
            extname: ".js"
        }))
        .pipe( dest(path.build.js) )
        .pipe( browsersync.stream() );
}

function libsJs() {
    return gulp.src([ //тут подключаем разные js в общую библиотеку. Отключите то, что вам не нужно.
        'node_modules/jquery/dist/jquery.js',
        'node_modules/pagepiling.js/dist/jquery.pagepiling.js',
        'node_modules/selectric/public/jquery.selectric.js',
        // 'node_modules/wowjs/dist/wow.js',
        // 'node_modules/slick-carousel/slick/slick.js',
        // 'node_modules/swiper/swiper-bundle.min.js',
        // 'node_modules/bootstrap/dist/js/bootstrap.min.js',
        // 'src/js/pageScrollToId.js'
        // 'node_modules/magnific-popup/dist/jquery.magnific-popup.js',
        // 'src/js/jquery.resizeOnApproach.1.0.min.js',
        // 'node_modules/isotope-layout/dist/isotope.pkgd.js',
        // 'node_modules/onepage-scroll-jquery/jquery.onepage-scroll.js',
    ])
    .pipe(concat('libs.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest(path.build.js))
}

function images() {
    return src(path.src.images)
        .pipe( imagemin({
            progressive: true,
            svgoPlugins: [{
                removeViewBox: false
            }],
            interlaced: true,
            optimizationLevel: 3 // 0 to 7
        }) )
        .pipe( dest(path.build.images) );
}

function clean() {
    return del(path.clean);
}

function fonts(parms) {
    src(path.src.fonts)
        .pipe(ttf2woff())
        .pipe(dest(path.build.fonts))
    return src(path.src.fonts)
        .pipe(ttf2woff2())
        .pipe(dest(path.build.fonts))
}

function fontsStyle(params) {
    let file_content = fs.readFileSync('src/assets/scss/fonts.scss');
    if (file_content == '') {
        fs.writeFile('src/assets/scss/fonts.scss', '', cb);
        return fs.readdir(path.build.fonts, function (err, items) {
            if (items) {
                let c_fontname;
                for (var i = 0; i < items.length; i++) {
                    let fontname = items[i].split('.');
                    fontname = fontname[0];
                    if (c_fontname != fontname) {
                        fs.appendFile('src/assets/scss/fonts.scss', '@include font("' + fontname + '", "' + fontname + '", "400", "normal");\r\n', cb);
                    }
                    c_fontname = fontname;
                }
            }
        })
    }
}


function cb() {

}

function watchFiles() {
    gulp.watch([path.watch.html], html);
    gulp.watch([path.watch.css], css);
    gulp.watch([path.watch.js], js);
    gulp.watch([path.watch.images], images);
}

const build = gulp.series( clean, gulp.parallel(html, css, js, images, libsCss, libsJs, fonts), fontsStyle );
const watch = gulp.parallel(build, watchFiles, browserSync);


// Exports Tasks

exports.fontsStyle = fontsStyle;
exports.fonts = fonts;
exports.html = html;
exports.css = css;
exports.js = js;
exports.images = images;
exports.libsCss = libsCss;
exports.libsJs = libsJs;
exports.clean = clean;
exports.build = build;
exports.watch = watch;
exports.default = watch;