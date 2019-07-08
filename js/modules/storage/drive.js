window.app = window.app || {};
window.app.storage = window.app.storage || {};
app.storage.googleDrive = (function() {
  "use strict";
  var GoogleAuth;
  var SCOPE = "https://www.googleapis.com/auth/drive.file";

  function load() {
    if (GoogleAuth && GoogleAuth.isSignedIn.get()) return Promise.resolve();
    else
      return $.cachedScript("https://apis.google.com/js/client.js").then(
        function() {
          return handleClientLoad();
        }
      );
  }

  function handleClientLoad() {
    return Promise.all([
      new Promise(function(resolve, reject) {
        gapi.load("client:auth2", function() {
          initClient()
            .then(resolve)
            .catch(reject);
        });
      }),
      new Promise(function(resolve) {
        gapi.load("picker", function() {
          resolve();
        });
      })
    ]);
  }

  function initClient() {
    var discoveryUrl =
      "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest";
    return gapi.auth2
      .init({
        discoveryDocs: [discoveryUrl],
        clientId:
          "1086928993551-unnb88phvl13i2j20rlla37apfpf2fln.apps.googleusercontent.com",
        scope: SCOPE
      })
      .then(function(resolve, reject) {
        GoogleAuth = gapi.auth2.getAuthInstance();
        // Listen for sign-in state changes.
        /* GoogleAuth.isSignedIn.listen(function(result) {
                console.log(result)
            }); */
        // Handle initial sign-in state. (Determine if user is already signed in.)
        return new Promise(function(resolve, reject) {
          if (!GoogleAuth.isSignedIn.get())
            GoogleAuth.signIn()
              .then(function(result) {
                resolve();
              })
              .catch(function(result) {
                reject({ error: result });
              });
          else {
            var user = GoogleAuth.currentUser.get();
            resolve();
          }
        });
      });
  }

  function revokeAccess() {
    GoogleAuth.disconnect();
  }

  function saveFile(data, callback) {
    load()
      .then(function() {
        const boundary = "-------314159265358979323846",
          delimiter = "\r\n--" + boundary + "\r\n",
          close_delim = "\r\n--" + boundary + "--",
          contentType = "application/json";
        var metadata = $.extend(
          {
            contentHints: {
              thumbnail: {
                image: data.thumbr
                  ? data.thumbr
                  : "iVBORw0KGgoAAAANSUhEUgAAANwAAADcCAIAAACUOFjWAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyFpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw_eHBhY2tldCBiZWdpbj0i77u_IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8-IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNS1jMDIxIDc5LjE1NDkxMSwgMjAxMy8xMC8yOS0xMTo0NzoxNiAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6OEVDMkIzQUE2MTA5MTFFNUE0RThFRjUzMDZDRTkwNTAiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6OEVDMkIzQTk2MTA5MTFFNUE0RThFRjUzMDZDRTkwNTAiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIChXaW5kb3dzKSI-IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOkQ3OTJDODk2NUZDNDExRTVCNjQxODZDNzM3NkI3QTRCIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOkQ3OTJDODk3NUZDNDExRTVCNjQxODZDNzM3NkI3QTRCIi8-IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY-IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8-Vjl8SgAAAjZJREFUeNrs27GtwjAUhlGCqJmLKRiOKZiLBUxHQaQE4T-JE59TPgkX0acbrsUbSiknaMnZI0CUIEpECaJElCBKRAmiBFEiShAlogRRIkoQJaIEUYIoESWIElGCKBEliBJEiShBlIgSRIkoQZSIEkQJokSUIEpECaJElCBKECWiBFEiShAlogRRIkoQJYgSUYIoESWIElGCKEGUiBJEiShBlIgSRIkoQZQgSkQJokSUIEpECaIEUSJKECWiBFEiShAlogRRgigRJYgSUYIo6cPFI5h1vT2Cp72ed4_UpGyoyCUOFCWIElGCKHfP4iJKXYoSXYpSl4hSl6I8NBfjolSkKFGkKBUpShQpShAlojyC-NWju8xZQynFU0h9sxScSYkoweu7kZdy-99TTUpYln-xXXWwuWk3KTMBpUqKHyjKfgdkalLGD7ToWGh-fblnTzMpFVn78expogRRgigRJfzD5fnUCvxZO8Z_2XZJNylBlIgSRAmixPa9d-O9uH5TtmublIgSRIkoQZQrqvxd7dfHs6f1yS_PMSlBlIgSRIkoQZSIEkQJokSUIEpECaJElCBKRAmiBFEiShAlogRRIkoQJYgSUYIoESWIElGCKBEliBJEiShBlIgSRIkoQZQgSkQJokSUIEpECaJElCBKECWiBFEiShAlogRRgigRJYgSUYIoESWIElGCKEGUiBJEiShBlIgSRAmiRJQgSkQJokSUIEpECaIEUSJKECWiBFEiStjGW4ABAHWBW5WRo23pAAAAAElFTkSuQmCC",
                mimeType: "image/png"
              },
              indexableText: data.indexableText ? data.indexableText : ""
            }
          },
          data.fileName
            ? {
                name: data.fileName,
                originalFilename: data.fileName + ".json"
              }
            : {},
          data.fileId === null ? { parents: [data.meta.parent] } : {}
        );
        gapi.client.request({
          path:
            "/upload/drive/v3/files" +
            (data.fileId === null ? "" : "/" + data.fileId),
          method: data.fileId === null ? "POST" : "PATCH",
          params: {
            uploadType: "multipart"
          },
          headers: {
            "Content-Type": 'multipart/related; boundary="' + boundary + '"'
          },
          body:
            delimiter +
            "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
            JSON.stringify(metadata) +
            delimiter +
            "Content-Type: " +
            contentType +
            "\r\n" +
            "\r\n" +
            data.content +
            close_delim,
          callback: callback
        });
      })
      .catch(function(error) {
        callback({ error: { message: error.message ? error.message : error } });
      });
  }

  function folderPicker(callback) {
    load()
      .then(function() {
        var docsView = new google.picker.DocsView()
          .setIncludeFolders(true)
          .setMimeTypes("application/vnd.google-apps.folder")
          .setSelectFolderEnabled(true)
          .setMode(google.picker.DocsViewMode.LIST);
        var picker = new google.picker.PickerBuilder()
          .addView(docsView)
          .setOAuthToken(gapi.auth.getToken().access_token)
          .hideTitleBar()
          .setLocale(app.options.settings.UI.language)
          .setAppId("1086928993551")
          .setTitle(app.helper.trans("Select Directory"))
          .setCallback(function(data) {
            if (data.action == google.picker.Action.PICKED) {
              callback(data.docs[0]);
            } else if (data.action == google.picker.Action.CANCEL) callback(null);
          })
          .build();
        picker.setVisible(true);
      })
      .catch(function(error) {
        callback({ error: { message: error.message ? error.message : error } });
      });
  }

  function filePicker(filetypes, callback) {
    load()
      .then(function() {
        var view = new google.picker.DocsView()
          .setParent("root")
          .setMimeTypes(filetypes)
          .setMode(google.picker.DocsViewMode.LIST)
          .setIncludeFolders(true);
        var picker = new google.picker.PickerBuilder()
          .setOAuthToken(gapi.auth.getToken().access_token)
          .setAppId("1086928993551")
          .addView(view)
          .setCallback(function(data) {
            if (data.action == google.picker.Action.PICKED) {
              callback(data.docs[0]);
            } else callback(null);
          })
          .setLocale(app.options.settings.UI.language)
          .setTitle(app.helper.trans("Open File"))
          .enableFeature(google.picker.Feature.SUPPORT_TEAM_DRIVES)
          .build();
        picker.setVisible(true);
      })
      .catch(function(error) {
        callback({ error: { message: error.message ? error.message : error } });
      });
  }

  function download(fileId, callback) {
    load()
      .then(function() {
        var xhr = new XMLHttpRequest();
        xhr.open(
          "GET",
          "https://www.googleapis.com/drive/v3/files/" + fileId + "?alt=media",
          true
        );
        xhr.setRequestHeader(
          "Authorization",
          "Bearer " + gapi.auth.getToken().access_token
        );
        xhr.onload = function() {
          callback(JSON.parse(xhr.response));
        };
        xhr.send();
      })
      .catch(function(error) {
        callback({ error: { message: error.message ? error.message : error } });
      });
  }

  return {
    getaccess: function() {
      load().then(handleAuthClick);
      //handleAuthClick();
    },
    signOut: function() {
      if (GoogleAuth) {
        revokeAccess();
        GoogleAuth.signOut();
      }
    },
    save: function(data, callback) {
      var data = {
        fileId: data.fileId,
        content: data.content,
        fileName: data.name ? data.name + "." + data.extention : null,
        thumbr: data.thumbr,
        meta: data.meta,
        indexableText: data.indexableText
      };
      if (
        app.options.settings.session.currentFile &&
        app.options.settings.session.currentFile.storage ==
          app.options.types.storage.googleDrive.name &&
        app.options.settings.session.currentFile.file
      ) {
        saveFile($.extend(true, data, {}), function(response) {
          callback(
            response.id
              ? { fileid: response.id }
              : {
                  error: { message: response.error.message.replace(/:.*/, "") }
                }
          );
        });
      } else {
        folderPicker(function(path) {
          if (path) {
            saveFile(
              $.extend(true, data, {
                meta: { parent: path.id }
              }),
              function(response) {
                callback(
                  response.id
                    ? { fileid: response.id }
                    : {
                        error: {
                          message: response.error.message.replace(/:.*/, "")
                        }
                      }
                );
              }
            );
          } else {
            callback(null);
          }
        });
      }
    },
    load: function(fileinfo, callback) {
      download(fileinfo.id, function(data) {
        callback(data, fileinfo.id);
      });
    },
    opendialog: function(filetypes, callback) {
      filePicker(filetypes, callback);
    },
    loadById: function(id, callback) {
      download(id, function(data) {
        callback(data, id);
      });
    },
    saveLibrary: function(data, callback) {
      var data = {
        fileId: data.fileId,
        content: data.content,
        fileName: data.name ? data.name + "." + data.extention : null,
        thumbr: data.thumbr,
        meta: data.meta
      };
      if (data.fileId && data.fileId != "") {
        saveFile(data, callback);
      } else {
        folderPicker(function(path) {
          if (path) {
            saveFile(
              $.extend(true, data, {
                meta: {
                  parents: [
                    {
                      kind: "drive#parentReference",
                      id: path.id
                    }
                  ]
                }
              }),
              callback
            );
          } else {
            callback(null);
          }
        });
      }
    },
    loadLibrary: function(data, callback) {
      if (data.fileId && data.fileId != "")
        this.load(
          {
            id: data.fileId
          },
          callback
        );
      else callback(null);
    }
  };
})();
