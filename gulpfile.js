/**
* Gulp build file for enliven-bootswatch
*/
const gulp = require("gulp");
const gulpLoadPlugins = require("gulp-load-plugins");
const $ = gulpLoadPlugins();

const fs = require("fs");
const browserSync = require("browser-sync");
const del = require("del");
const wiredep = require("wiredep").stream;
const browserify = require("browserify");
const babelify = require("babelify");
const buffer = require("vinyl-buffer");
const source = require("vinyl-source-stream");

const environments = require("gulp-environments");
const development = environments.development;
const production = environments.production;

const reload = browserSync.reload;

const destination = "dist";

gulp.task("styles", () => {
  return gulp
    .src("app/styles/main.scss")
    .pipe($.plumber())
    .pipe(development($.sourcemaps.init()))
    .pipe(
      $.sass
        .sync({
          outputStyle: "expanded",
          precision: 10,
          includePaths: ["."]
        })
        .on("error", $.sass.logError)
    )
    .pipe(
      $.autoprefixer({
        browsers: ["> 1%", "last 2 versions", "Firefox ESR"]
      })
    )
    .pipe(development($.sourcemaps.write()))
    .pipe(gulp.dest(".tmp/styles"))
    .pipe(
      reload({
        stream: true
      })
    );
});

gulp.task("scripts", () => {
  const b = browserify({
    entries: "app/scripts/main.js",
    transform: babelify,
    debug: true
  });

  return b
    .bundle()
    .pipe(source("bundle.js"))
    .pipe($.plumber())
    .pipe(buffer())
    .pipe(
      development(
        $.sourcemaps.init({
          loadMaps: true
        })
      )
    )
    .pipe(development($.sourcemaps.write(".")))
    .pipe(gulp.dest(".tmp/scripts"))
    .pipe(
      reload({
        stream: true
      })
    );
});

function lint(files, options) {
  return gulp
    .src(files)
    .pipe(
      reload({
        stream: true,
        once: true
      })
    )
    .pipe($.eslint(options))
    .pipe($.eslint.format())
    .pipe($.if(!browserSync.active, $.eslint.failAfterError()));
}

gulp.task("lint", () => {
  return lint("app/scripts/**/*.js", {
    fix: true,
    parserOptions: {
      sourceType: "module"
    }
  }).pipe(gulp.dest("app/scripts"));
});

gulp.task("lint:test", () => {
  return lint("test/spec/**/*.js", {
    fix: true,
    env: {
      mocha: true
    }
  }).pipe(gulp.dest("test/spec/**/*.js"));
});

gulp.task("html", ["views", "styles", "scripts"], () => {
  return gulp
    .src(["app/*.html", ".tmp/**/*.html"])
    .pipe(
      $.useref({
        searchPath: [".tmp", "app", "."]
      })
    )
    .pipe(production($.if("*.js", $.uglify())))
    .pipe(
      $.if(
        "*.css",
        $.cssnano({
          safe: true,
          autoprefixer: false
        })
      )
    )
    .pipe($.if("*.js", $.rev()))
    .pipe($.if("*.css", $.rev()))
    .pipe(
      $.revReplace({
        prefix: "/" // absolute URLs
      })
    )
    .pipe(
      $.if(
        "*.html",
        $.htmlmin({
          collapseWhitespace: true
        })
      )
    )
    .pipe(gulp.dest(destination));
  /*
    .pipe(reload())
*/
});

gulp.task("images", () => {
  return gulp
    .src("app/images/**/*")
    .pipe(
      $.cache(
        $.imagemin({
          progressive: true,
          //interlaced: true,
          // don't remove IDs from SVGs, they are often used
          // as hooks for embedding and styling
          svgoPlugins: [
            {
              cleanupIDs: false
            }
          ]
        })
      )
    )
    .pipe(gulp.dest(destination + "/images"));
});

gulp.task("fonts", () => {
  return gulp
    .src(
      require("main-bower-files")("**/*.{eot,svg,ttf,woff,woff2}", function(
        err
      ) {}).concat("app/fonts/**/*")
    )
    .pipe(gulp.dest(".tmp/fonts"))
    .pipe(gulp.dest(destination + "/fonts"));
});

gulp.task("extras", () => {
  return gulp
    .src(["app/CNAME", "app/robots.txt"], {
      dot: true
    })
    .pipe(gulp.dest(destination));
});

gulp.task("clean", () => {
  return del([".tmp", destination]);
});

gulp.task("serve", ["views", "styles", "scripts", "fonts"], () => {
  browserSync({
    notify: false,
    port: 9000,
    server: {
      baseDir: [".tmp", "app"],
      routes: {
        "/bower_components": "bower_components"
      }
    }
  });

  gulp
    .watch([
      "app/*.html",
      "app/includes/*",
      "app/layouts/*",
      "app/templates/*",
      "app/images/**/*",
      ".tmp/fonts/**/*"
    ])
    .on("change", reload);

  gulp.watch("app/**/*.jade", ["views"]);
  gulp.watch("app/includes/**/*", ["views"]);
  gulp.watch("app/layouts/**/*", ["views"]);
  gulp.watch("app/templates/**/*", ["views"]);
  gulp.watch("app/styles/**/*.scss", ["styles"]);
  gulp.watch("*.scss", ["styles"]);
  gulp.watch("app/scripts/**/*.js", ["scripts"]);
  gulp.watch("app/fonts/**/*", ["fonts"]);
  gulp.watch("bower.json", ["wiredep", "fonts"]);
});

gulp.task("serve:dist", () => {
  browserSync({
    notify: false,
    port: 9000,
    server: {
      baseDir: [destination]
    }
  });
});

gulp.task("serve:test", ["scripts"], () => {
  browserSync({
    notify: false,
    port: 9000,
    ui: false,
    server: {
      baseDir: "test",
      routes: {
        "/scripts": ".tmp/scripts",
        "/bower_components": "bower_components"
      }
    }
  });

  gulp.watch("app/scripts/**/*.js", ["scripts"]);
  gulp.watch("test/spec/**/*.js").on("change", reload);
  gulp.watch("test/spec/**/*.js", ["lint:test"]);
});

// inject bower components
gulp.task("wiredep", () => {
  gulp
    .src("app/styles/main.scss")
    .pipe(
      wiredep({
        ignorePath: /^(\.\.\/)+/
      })
    )
    .pipe(gulp.dest("app/styles"));

  gulp
    .src("app/layouts/*.jade")
    .pipe(
      wiredep({
        exclude: ["bootstrap-sass"],
        ignorePath: /^(\.\.\/)*\.\./
      })
    )
    .pipe(gulp.dest("app"));
});

gulp.task("views", () => {
  return gulp
    .src("app/*.jade")
    .pipe(
      $.data(function(file) {
        return {
          data: JSON.parse(fs.readFileSync("app/includes/data.json"))
        };
      })
    )
    .pipe($.plumber())
    .pipe(
      $.jade({
        pretty: true
      })
    )
    .pipe(
      $.rename(function(path) {
        if (path.extname == ".html" && path.basename != "index") {
          // rename from about.html => about/index.html
          path.dirname += "/" + path.basename;
          path.basename = "index";
        }
        return path;
      })
    )
    .pipe(gulp.dest(".tmp"))
    .pipe(
      reload({
        stream: true
      })
    );
});

// deploy to Github pages
gulp.task("deploy", ["build", "extras"], () => {
  environments.current(production);
  return gulp
    .src(destination)
    .pipe(
      $.subtree({
        remote: "github",
        branch: "gh-pages",
        message: "deployed by gulp"
      })
    )
    .pipe($.clean());
});

gulp.task("build", ["lint", "html", "images", "fonts", "extras"], () => {
  return gulp.src(destination + "/**/*").pipe(
    $.size({
      title: "build",
      gzip: true
    })
  );
});

// Update bower, meteor, npm at once:
gulp.task("bump", function() {
  gulp
    .src(["./bower.json", "./package.js", "./package.json"])
    .pipe($.bump({ type: "minor" }))
    .pipe(gulp.dest("./"));
});

// register git pre-commit task
// see also https://github.com/therealklanni/guppy-pre-commit/issues/9
gulp.task("pre-commit", ["lint", "styles", "scripts"]);

gulp.task("default", ["clean"], () => {
  gulp.start("build");
});
