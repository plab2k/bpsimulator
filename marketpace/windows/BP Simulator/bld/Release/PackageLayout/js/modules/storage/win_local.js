;
window.app = window.app || {};
window.app.storage = window.app.storage || {};
app.storage.local = (function () {
    var applicationData = Windows.Storage.ApplicationData.current;
    var localSettings = applicationData.localSettings;
    var roamingFolder = applicationData.roamingFolder;
    var temporaryFolder = applicationData.temporaryFolder;
    const
	PREFIX = "model", INDEX_NAME = "index", LIB_NAME = "library";
    function writeFile(data, callback) {
        var result;
        function write(file, content) {
            return Windows.Storage.FileIO.writeTextAsync(file, content);
        };
        function getfilepicker(callback) {
            var savePicker = new Windows.Storage.Pickers.FileSavePicker();
            savePicker.suggestedStartLocation = Windows.Storage.ApplicationData.current.roamingFolder; //Windows.Storage.Pickers.PickerLocationId.documentsLibrary;
            savePicker.fileTypeChoices.insert("BP Simulator model", [".json"]);
            savePicker.suggestedFileName = data.name;
            return savePicker.pickSaveFileAsync();            
        };

        if (data.fileId)
            Windows.Storage.StorageFile.getFileFromPathAsync(data.fileId).done(function (file) {
                if (file) {
                    result = file;
                    write(file, data.content).done(function complete() {
                        callback(result ? { fileid: result.path, name: result.displayName } : false);
                    });
                }
                else
                    getfilepicker().then(function complete(file) {
                        result = file;
                        if (file)
                            return write(file, data.content);
                        else return false;
                    }).done(function complete() {
                        callback(result ? { fileid: result.path, name: result.displayName } : false);
                    });
            });
        else
            getfilepicker().then(function complete(file) {
                result = file;
                if (file)
                    return write(file, data.content);
                else return false
            }).done(function complete() {
                callback(result ? { fileid: result.path, name: result.displayName } : false);
            });
    };
    function readFile(file, callback) {
        Windows.Storage.FileIO.readTextAsync(file).then(function (contents) {
            if (callback) callback(contents, file.path);
        });
    };
    function writetmp(name, content, callback) {

        temporaryFolder.createFileAsync(name, Windows.Storage.CreationCollisionOption.replaceExisting).then(function (file) {
            return Windows.Storage.FileIO.writeTextAsync(file, content);
        }).done(function () {
            callback(true);
        }, function (error) {
            WinJS.log && WinJS.log(error);
        });

    };
    function readtmp(name, callback) {
        temporaryFolder.tryGetItemAsync(name).then(function (file) {
            if (file !== null)
                return Windows.Storage.FileIO.readTextAsync(file)
            else
                return false
        }).done(function (content) {
            callback(content);
        });
    };
    function deletetmp(name, callback) {
        temporaryFolder.tryGetItemAsync(name).then(function (file) {
            if (file !== null)
                return file.deleteAsync();
            else return false;
        }).done(function (result) {
            if (callback)
                callback(result);
        });
    };

    return {
        save: function (data, callback) {
            writeFile(data, callback);
        },
        load: function (data, callback) {
            readFile(data, callback)
        },
        opendialog: function (filetypes, callback) {
            var openPicker = new Windows.Storage.Pickers.FileOpenPicker();
            openPicker.viewMode = Windows.Storage.Pickers.PickerViewMode.list;
            openPicker.fileTypeFilter.replaceAll(filetypes);
            openPicker.suggestedStartLocation = Windows.Storage.ApplicationData.current.roamingFolder;
            openPicker.pickSingleFileAsync().done(function (file) {
                if (file)
                    Windows.Storage.AccessCache.StorageApplicationPermissions.futureAccessList.add(file);
                callback(file);
            });
        },
        removeModel: function (id, callback) {
            callback();
        },
        getall: function (callback) {
            callback($.map(localSettings.values, function (val, key) {
                return (key.indexOf(PREFIX) === 0) ? val : null
            }))
        },
        saveSettings: function (obj) {
            localSettings.values[app.options.keyNames.settings] = JSON.stringify(obj);
        },
        loadSettings: function () {
            return localSettings.values[app.options.keyNames.settings] ? JSON.parse(localSettings.values[app.options.keyNames.settings]) : null;
        },
        saveSession: function (key, value, callback) {
            if (value !== null)
                writetmp(key, value, callback);
            else
                deletetmp(key, callback)
        },
        loadSession: function (key, callback) {
            readtmp(key, callback)
        }
    }
}());