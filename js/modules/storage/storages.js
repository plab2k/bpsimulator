;
window.app = window.app || {};
app.storage = (function() {
    "use strict";
    return {
        restore: function() {
            var info, item;
            app.storage[app.options.settings.General.storage].getall(function(items) {
                $.each(items, function(i, val) {
                    try {
                        info = JSON.parse(val).info;
                    } catch (e) {
                        return true
                    }
                    if (info && info.id) {
                        item = getIndexItem(info.id)
                        if (!item)
                            app.storage.index.content.push(info);
                    }
                });
                app.control.updateFileList();
            })
        },
        share: function(id) {
            if (app.options.settings.General.storage != app.options.types.storage.local.name)
                app.storage[app.options.settings.General.storage].share(id);
        },
        showpicker: function(callback) {
            app.storage[app.options.settings.General.storage].showpicker(callback);
        },
        saveSettings: function(obj) {
            app.storage.local.saveSettings(obj);
        },
        loadSettings: function() {
            return app.storage.local.loadSettings();
        }
    }
}());