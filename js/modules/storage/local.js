window.app = window.app || {};
window.app.storage = window.app.storage || {};
window.requestFileSystem =
  window.requestFileSystem || window.webkitRequestFileSystem;
app.storage.local = (function() {
  "use strict";
  var textFile;
  const PREFIX = "model",
    INDEX_NAME = "index",
    LIB_NAME = "library";
  return {
    save: function(data, callback) {
      var textFileAsBlob = new Blob(["\ufeff", data.content], {
        type: data.type
      });
      var downloadLink = document.createElement("a");
      downloadLink.download = data.name + "." + data.extention;
      if (window.navigator.msSaveBlob) {
        window.navigator.msSaveBlob(textFileAsBlob, downloadLink.download);
        if (callback) callback(true);
      } else {
        downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
        downloadLink.onclick = function(event) {
          document.body.removeChild(event.target);
          if (callback) callback(true);
        };
        downloadLink.style.display = "none";
        document.body.appendChild(downloadLink);
        downloadLink.click();
      }
    },
    opendialog: function(filetypes, callback) {
      var fileinput = document.createElement("input");
      fileinput.type = "file";
      fileinput.accept = filetypes;
      fileinput.onclick = function(event) {
        document.body.removeChild(event.target);
      };
      fileinput.onchange = function(event) {
        var f = event.target.files[0];
        callback(f);
      };
      document.body.appendChild(fileinput);
      $(fileinput).trigger("click");
      callback(null);
    },
    load: function(file, callback) {
      var reader = new FileReader();
      app.control.startLoading();
      reader.onload = (function(theFile) {
        return function(e) {
          app.control.endLoading();
          callback(e.target.result, null);
        };
      })(file);
      if (file.name.indexOf(".vsd") > 0) {
        app.control.endLoading();
        callback(file, null);
      } else reader.readAsText(file);
      // callback(localStorage.getItem((data.isIndex) ? INDEX_NAME : (data.isLibrary) ? LIB_NAME : PREFIX + data.modelId));
    },
    removeModel: function(id, callback) {
      localStorage.removeItem(PREFIX + id);
      callback();
    },
    getall: function(callback) {
      callback(
        $.map(localStorage, function(val, key) {
          return key.indexOf(PREFIX) === 0 ? val : null;
        })
      );
    },
    saveSettings: function(obj) {
      try {
        localStorage.setItem(
          app.options.keyNames.settings,
          JSON.stringify(obj)
        );
      } catch (e) {
        console.log(e);
      }
      //localStorage.setItem(app.options.keyNames.settings, JSON.stringify(obj));
    },
    loadSettings: function() {
      var data,
        res = null;
      try {
        data = localStorage[app.options.keyNames.settings];
      } catch (err) {
        app.snackbar.show(
          "Settings are not loaded",
          null,
          app.options.types.messageType.critical,
          null
        );
      }
      if (typeof data != "undefined") {
        res = JSON.parse(data);
      }
      return res;
    },
    saveSession: function(key, value, callback) {
      if (value !== null) {
        try {
          sessionStorage.setItem(key, value);
        } catch (err) {
          if (
            err.name === "QuotaExceededError" ||
            err.name === "NS_ERROR_DOM_QUOTA_REACHED"
          ) {
            app.snackbar.show(
              "Can't store session data",
              null,
              app.options.types.messageType.critical,
              null
            );
          } else
            app.events.error(
              "name: " +
                err.name +
                "\nmessage: " +
                err.message +
                "\nstack: " +
                err.stack,
              true
            );
        }
      } else sessionStorage.removeItem(key);
      if (callback) callback();
    },
    loadSession: function(key, callback) {
      callback(sessionStorage.getItem(key));
    },
    loadById: function(id, callback) {
      callback(null, id);
    },
    saveLog: function(data, callback) {
      var err = function(error) {
        console.log(error);
        if (callback) callback(false);
      };
      var success = function() {
        if (callback) callback(true);
      };
      window.requestFileSystem(
        window.TEMPORARY,
        1024 * 1024,
        function(fs) {
          fs.root.getFile(
            "simulate.log",
            {
              create: true
            },
            function(fileEntry) {
              fileEntry.createWriter(function(fileWriter) {
                fileWriter.onwriteend = success;
                fileWriter.onerror = err;
                if (!data) fileWriter.truncate(0);
                else {
                  fileWriter.seek(fileWriter.length);
                  fileWriter.write(new Blob([data]));
                }
              }, err);
            },
            err
          );
        },
        err
      );
    },
    loadLog: function(callback) {
      var err = function(error) {
        callback(false);
      };
      window.requestFileSystem(
        window.TEMPORARY,
        1024 * 1024,
        function(fs) {
          fs.root.getFile(
            "simulate.log",
            {
              create: true
            },
            function(fileEntry) {
              fileEntry.file(function(file) {
                var reader = new FileReader();
                reader.onloadend = function(e) {
                  callback(this.result);
                };
                reader.readAsText(file);
              }, err);
            },
            err
          );
        },
        err
      );
    },
    saveLibrary: function(data, callback) {
      app.snackbar.show(
        "Not applicable for local storage",
        null,
        app.options.types.messageType.info,
        null
      );
      callback(null);
    },
    loadLibrary: function(data, callback) {
      app.snackbar.show(
        "Not applicable for local storage",
        null,
        app.options.types.messageType.info,
        null
      );
      callback(null);
    },
    transfer: function(callback) {
      var move = function(parent) {
        var i, elem;
        for (i in parent.content) {
          elem = parent.content[i];
          if (elem.content) {
            move(elem);
          } else {
            // file
            if (localStorage[PREFIX + elem.id])
              app.storage.local.save(
                {
                  extention: "json",
                  type: "application/json",
                  thumbr: null,
                  fileId: elem.name,
                  content: localStorage.getItem(PREFIX + elem.id),
                  name: elem.name,
                  modelId: elem.id
                },
                function() {
                  callback();
                }
              );
          }
        }
      };
      move(JSON.parse(localStorage.getItem(INDEX_NAME)));
    },
    testappdata: function(callback) {
      callback(localStorage.getItem(INDEX_NAME) ? true : false);
    }
  };
})();
