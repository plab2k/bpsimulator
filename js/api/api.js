;
window.api = (function() {
    'use strict';
    return {
        model: {
            create: function() {
                app.core.newModel();
                app.model.info.created = (new Date()).toUTCString();
                return app.model
            },
            open: function(data, fileId) {
                var fileId = fileId || null,
                    cansave = false;

                function onload(model) {
                    if (model) {
                        app.core.load(model);
                        app.control.update();
                        if (fileId)
                            app.helper.lastOpenedmodel(fileId, cansave);
                        return app.model
                    } else
                        return null
                }
                this.create();
                if (typeof data === 'string') {
                    if (data.indexOf("{\"") == 0) { // JSON
                        cansave = true;
                        var unjs;
                        try {
                            unjs = JSON.parse(data);
                        } catch (err) {
                            app.snackbar.show("Unsupported file format", "Contact Support", app.options.types.messageType.critical, app.helper.contactsupport);
                            app.events.error("name: Unsupported JSON format\nmessage: " + err.message, true);
                        }
                        onload(unjs);
                    } else if (data.indexOf("<?xml") == 0 && app.import && app.import.bpmn) { // XML					  
                        try {
                            var xml = $.parseXML(data.replace(/\w+:/g, ""));
                            app.import.bpmn.load(xml, api.model.create());
                            onload(app.model);
                        } catch (err) {
                            app.snackbar.show("Unsupported file format", "Contact Support", app.options.types.messageType.critical, app.helper.contactsupport);
                            app.events.error("name: Unsupported XML format\nmessage: " + err.message, true);
                        }
                    }
                } else if (typeof data === 'object' && data.info) { // JSON model
                    cansave = true;
                    onload(data);
                } else if (typeof data === 'object' && app.import && app.import.visio) { // zip
                    app.import.visio.load(data, api.model.create(), onload);
                } else if (data.error) {
                    app.snackbar.show(data.error, null, app.options.types.messageType.critical, null);
                }
                /*
                 * if ($.isPlainObject(obj) === true)// load JSON or by ID { app.core.load(obj); app.control.update(); return app.model } else app.storage.load({ modelId : obj }, function(data) { app.core.load(data); app.control.update(); return app.model; })
                 */
            },
            save: function(storage, callback) {
                svgAsPngUri(app.helper.exportimg(), { scale: 1600 / Math.max(document.getElementById("area").clientHeight, document.getElementById("area").clientWidth) }, function(thumbr) {
                    var id, prop, model = $.extend(true, {}, app.model);
                    for (id in model.objects) {
                        for (prop in model.objects[id]) {
                            if (prop.charAt(0) == "_")
                                delete model.objects[id][prop];
                        }
                    };
                    app.model.info.coreVersion = app.options.coreVersion;
                    app.model.info.lastSaved = (new Date()).toUTCString();
                    app.model.info.revision++;
                    app.storage[storage].save({
                        modelId: app.model.info.id,
                        content: app.core.serialize(model),
                        name: app.model.info.name,
                        extention: 'json',
                        type: 'application/json',
                        thumbr: thumbr ? thumbr.replace(/^data.*base64,/, '').replace(/\+/g, '-').replace(/\//g, '_') : null,
                        fileId: app.options.settings.session.currentFile && app.options.settings.session.currentFile.file ? app.options.settings.session.currentFile.file : null,
                        indexableText: app.helper.indexableText(app.model)
                    }, function(result) {
                        if (callback)
                            callback(result);
                    });
                });
            },
            remove: function(id) {
                app.storage.removeItem(id);
                return app.storage.index;
            },
            copy: function() {
                app.model.info.id = app.helper.generateId();
                app.model.info.created = (new Date()).toUTCString();
                app.model.info.revision = 0;
                return app.model;
            },
            share: function() {
                app.storage.share(app.model.info.id);
            },
            items: {
                add: function(objClass, prop) {
                    var obj = app.core.createObject(objClass);
                    (prop) ? $.extend(true, obj, prop): null;
                    app.control.addElement(obj, app.options.types.nameType.create);
                    return obj
                },
                copy: function(source, prop) {
                    var obj = app.core.createObject(source.objClass);
                    $.extend(true, obj, source, {
                        id: obj.id
                    }, prop || {});
                    for (var field in app.options.types.objResFields.concat(["prior", "next"])) {
                        if (obj[app.options.types.objResFields.concat(["prior", "next"])[field]] !== undefined)
                            obj[app.options.types.objResFields.concat(["prior", "next"])[field]].objects = []
                    }
                    app.control.addElement(obj, app.options.types.nameType.copy);
                    return obj
                },
                clone: function(source) {
                    if (app.model.objects[source.id])
                        return false;
                    var obj = app.core.createObject(source.objClass),
                        oldid = obj.id;
                    app.model.objects[source.id] = app.model.objects[obj.id];
                    $.extend(true, obj, source);
                    delete app.model.objects[oldid];
                    app.control.addElement(obj, app.options.types.nameType.clone);
                    return obj;
                },
                import: function(objClass, prop) {
                    var obj = app.core.createObject(objClass),
                        oldid = obj.id;
                    app.model.objects[prop.id] = app.model.objects[obj.id];
                    $.extend(true, obj, prop);
                    delete app.model.objects[oldid];
                    // app.control.addElement(obj, app.options.types.nameType.clone);
                    return obj
                },
                remove: function(id) {
                    app.core.deleteObject(id);
                    app.helper.tree.rescan();
                }
            }
        },
        app: {
            currenthistory: 0,
            setSnapshot: function(isnew) {
                const that = this;
                if (isnew === true)
                    app.options.settings.session.historyArray = [];
                if (app.options.settings.session.historyArray.length < app.options.historylength)
                    app.options.settings.session.historyArray.push(app.options.settings.session.historyArray.length)
                else
                    app.options.settings.session.historyArray.push(app.options.settings.session.historyArray.shift());
                app.storage.local.saveSession("snapshot" + (app.options.settings.session.historyArray[app.options.settings.session.historyArray.length - 1]), app.core.serialize(app.model), function() {
                    that.currenthistory = 1;
                });
                return app.options.settings.session.historyArray
            },
            getSnapshot: function(forward) {
                var dif = forward === true ? 1 : -1,
                    pos = app.options.settings.session.historyArray.length - api.app.currenthistory + dif;
                if (pos >= 0 && pos < app.options.settings.session.historyArray.length) {
                    app.storage.local.loadSession("snapshot" + app.options.settings.session.historyArray[pos], function(data) {
                        $("main").modeler("clear");
                        api.model.open(data);
                    });
                    api.app.currenthistory = (forward === true) ? api.app.currenthistory - 1 : api.app.currenthistory + 1;
                } else {
                    app.snackbar.show("No data loaded", null, app.options.types.messageType.info, null);
                }
                return null;
            }
        }
    }
}());