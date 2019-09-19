var gulp = require("gulp");
var replace = require("gulp-replace");
var del = require("del");
var debug = require("gulp-debug");
var cleanCSS = require("gulp-clean-css");
var concat = require("gulp-concat");
let uglify = require("gulp-uglify-es").default;
var touch = require("gulp-touch");
var fs = require("fs");
const cfg = {
  pub: "../pub",
  version: { jq: "3.4.1", jui: "1.12.1", app: "2.10.010" }
};
var script_name = "bpsim-" + cfg.version.app + ".js";
var metrika = fs.readFileSync("./ant/metrika.app.html", "utf8");
var analytics = fs.readFileSync("./ant/analytics.app.html", "utf8");

const scriptlist = [
  "https://ajax.googleapis.com/ajax/libs/jquery/" +
    cfg.version.jq +
    "/jquery.min.js",
  "https://ajax.googleapis.com/ajax/libs/jqueryui/" +
    cfg.version.jui +
    "/jquery-ui.min.js",
  script_name
];

gulp.task("css", function() {
  return gulp
    .src([
      "./css/vendor/normalize.css",
      "./css/common.css",
      "./css/header.css",
      "./css/bpctrlpanel.css",
      "./css/bpdialog.css",
      "./css/bpmodeler.css"
    ])
    .pipe(concat("_concated.css"))
    .pipe(cleanCSS({ advanced: false, keepSpecialComments: 0 }))
    .pipe(gulp.dest("./css"));
});

gulp.task("clear", function(done) {
  del([cfg.pub + "/**/*", "_concated.css"], { force: true });

  done();
});

gulp.task(
  "index",
  gulp.series("clear", function() {
    var stylecss = fs.readFileSync("./css/_concated.css", "utf8");
    return gulp
      .src(["index.html"])
      .pipe(replace(/<link.*css.*>/g, ""))
      .pipe(replace(/<script.*\/script>/g, ""))
      .pipe(replace(/^[ \t\r\n]*$/gm, ""))
      .pipe(
        replace(
          /<\/body/,
          scriptlist
            .map(i => {
              return '\t<script src="' + i + '"></script>';
            })
            .join("\n") +
            "\n" +
            analytics +
            "\n\
</body"
        )
      )
      .pipe(replace(/<\/head>/, "<style>" + stylecss + "</style>\n</head>"))
      .pipe(replace(/#version#/g, cfg.version.app))
      .pipe(gulp.dest(cfg.pub))
      .pipe(touch());
  })
);

gulp.task("serviceworker", function() {
  return gulp
    .src(["./js/app/sw.js"])
    .pipe(
      replace(
        /'#sources'/,
        scriptlist
          .map(i => {
            return '"' + i + '"';
          })
          .join(",\n\t\t")
      )
    )
    .pipe(replace(/#version/g, cfg.version.app.replace(/\./g, "")))
    .pipe(gulp.dest(cfg.pub))
    .pipe(touch());
});

gulp.task("js", function() {
  return gulp
    .src([
      "./js/vendor/globalize.js",
      "./js/vendor/globalize.culture.ru.js",
      "./js/vendor/globalize.culture.es.js",
      "./js/vendor/saveSvgAsPng.js",
      // './js/vendor/zip.js',
      // './js/vendor/inflate.js',
      "./js/lang/ru.js",
      "./js/lang/es.js",
      "./js/lang/fr.js",
      "./js/vendor/jquery.ui.touch-punch.js",
      "./js/widget/ctrlpanel.js",
      "./js/widget/modeler.js",
      "./js/widget/dialogs.js",
      "./js/widget/objdetail.js",
      "./js/widget/timeranges.js",
      "./js/widget/dashboard.js",
      "./js/widget/floatbtn.js",
      "./js/common/dbltap.js",
      "./js/common/helper.js",
      "./js/common/common.js",
      //'./js/common/solver.js',
      "./js/app/core.js",
      "./js/app/states.js",
      "./js/app/options.js",
      "./js/app/registersw.js",
      "./js/modules/storage/local.js",
      "./js/modules/storage/drive.js",
      //'./js/modules/storage/onedrive.js',
      "./js/modules/storage/library.js",
      "./js/api/api.js",
      "./js/controller.js",
      "./js/modules/area.js",
      "./js/modules/autosave.js",
      "./js/modules/events.js",
      "./js/modules/errors.js",
      "./js/modules/snackbar.js",
      "./js/modules/simulation/control.js",
      "./js/modules/simulation/init.js",
      "./js/modules/simulation/execute.js",
      "./js/modules/simulation/log.js",
      "./js/modules/simulation/collector.js",
      "./js/modules/import/bpmn.js",
      // './js/modules/import/visio.js',
      "./js/modules/loader.js",
      "./js/modules/distr.js"
    ])
    .pipe(concat(script_name))
    .pipe(uglify())
    .pipe(gulp.dest("../pub"))
    .pipe(touch());
});
gulp.task(
  "build",
  gulp.series(
    "index",
    "js",
    "serviceworker",
    "css",

    function() {
      return gulp.src(["demos/1.json"]).pipe(gulp.dest(cfg.pub + "/demos"));
    },
    function() {
      return gulp.src(["manifest.json"]).pipe(gulp.dest(cfg.pub));
    }
  )
);
