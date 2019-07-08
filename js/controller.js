;
$(function() {
    "use strict";
    window.app = window.app || {};
    window.app.control = (function() {
        var loading = 0;
        return {
            update: function() {
                app.helper.tree.rescan();
                $("main").modeler("addObj", $.map(app.model.objects, function(val) {
                    return val.id
                })).modeler("updateLinks").modeler("updateState");
                $("#controlpanel").ctrlpanel({
                    'modelName': app.model.info.name
                });
                $(".controlpanel.bpsReport").bpsReport("update");
                app.events.titleChanged();
            },
            addElement: function(obj, nameType) {
                switch (nameType) {
                    case app.options.types.nameType.create:
                        obj.name = app.helper.trans(obj.name) + " " + ($("main ." + obj.objClass).not("svg").length + 1);
                        break;
                    case app.options.types.nameType.copy:
                        obj.name = app.helper.trans("Copy of").concat(" ", obj.name);
                        break;
                };
                $("main").modeler("addObj", [obj.id]);
                $(".controlpanel.bpsReport").bpsReport("update");
            },
            startLoading: function() {
                if (loading == 0)
                    $("#preloader").show();
                loading++;
            },
            endLoading: function() {
                loading--;
                if (loading == 0)
                    $("#preloader").hide();
            },
            onError: function(msg) {
                loading = 1;
                app.control.endLoading();
            }
        };
    }());
    /* init */
    const hasSettings = app.options.load();
    initUI();
    $("#preloader").hide();
    if (app.helper.getParameterByName("state")) { // load GD file
        if (typeof ga !== 'undefined')
            ga('set', 'campaignSource', 'gd');
        try {
            var request = JSON.parse(decodeURI(app.helper.getParameterByName("state")));
        } catch (e) {
            api.model.create();
            app.events.error("name: Bad request from GD\nmessage: " + e.message + "\nQuery: " + window.location.search, true);
            app.snackbar.show("Unsupported file format", "Reload", app.options.types.messageType.critical, function() {
                window.location = window.location.protocol.concat('//', window.location.hostname, window.location.pathname);
            })
        }
    }
    if (typeof request !== 'undefined' && request.action === "open") { // open external
        app.storage[app.options.types.storage.googleDrive.name].loadById(request.ids[0], function(content, fileid) {
            if (content && content.error === undefined) {
                api.model.open(content);
                api.app.setSnapshot(true);
                app.events.add("modelAction", "sharedOpen");
            } else
                app.snackbar.show(content && content.error ? content.error.message : 'No data loaded', null, app.options.types.messageType.critical, null);
        });
    } else if (typeof request !== 'undefined' && request.action === "create") { // create new
        $("#controlpanel").ctrlpanel("showPanel", 1);
        api.model.create();
        app.events.add("modelAction", "sharedCreate", null, false);
    } else if (app.options.settings.General.welcomeScreen == true) { // welcome
        app.helper.loadContent("#welcome").bpsWelcome({
            openModel: function(event, result) {
                // $("#controlpanel").ctrlpanel("showPanel", 1);
                switch (result.action) {
                    case "new":
                        newmodel();
                        // api.model.create();
                        // api.app.setSnapshot(true);
                        $("#controlpanel").ctrlpanel("showPanel", 1);
                        break;
                    case "demo":
                        api.model.create();
                        openDemo(function() {
                            api.app.setSnapshot(true);
                            app.helper.expandAll($("#control"));
                            showDialog("#help");
                        });
                        break;
                    case "last":
                        if (app.options.settings.session.lastsavedmodel && app.options.settings.session.lastsavedmodel.storage && app.options.settings.session.lastsavedmodel.file)
                            app.storage[app.options.settings.session.lastsavedmodel.storage].loadById(app.options.settings.session.lastsavedmodel.file, function(content, fileid) {
                                if (fileid) {
                                    api.model.open(content, fileid);
                                    api.app.setSnapshot(true);
                                    app.events.add("modelAction", "lastOpen");
                                }
                            });
                        break;
                }
            }
        })
    } else if (app.options.settings.General.autoOpen === true && app.options.settings.session.lastsavedmodel && app.options.settings.session.lastsavedmodel.storage && app.options.settings.session.lastsavedmodel.file) { // autopen
        app.control.startLoading();
        //initUI();
        if (app.options.settings.session.lastsavedmodel && app.options.settings.session.lastsavedmodel.storage && app.options.settings.session.lastsavedmodel.file)
            app.storage[app.options.settings.session.lastsavedmodel.storage].loadById(app.options.settings.session.lastsavedmodel.file, function(content, fileid) {
                if (fileid) {
                    api.model.open(content, fileid);
                    api.app.setSnapshot(true);
                    app.events.add("modelAction", "autoOpen");
                    app.control.endLoading();
                }
            });
    } else if (!hasSettings) { //новые пользователи сервиса - открытие Демо и панели помощи

        setLang();
        api.model.create();
        openDemo(function() {
            api.app.setSnapshot(true);
            app.helper.expandAll($("#control"));
            showDialog("#help");
        });

    } else { // default
        newmodel();
    };

    function setLang() {
        var lng = (navigator.browserLanguage || navigator.language || navigator.userLanguage).substring(0, 2).toLowerCase();
        if ($.inArray(lng, $.map(app.options.types.lang, function(val) {
                return val.culture
            })) != -1) {
            app.options.settings.UI.language = lng;
            Globalize.culture(lng);
            $("#controlpanel").ctrlpanel("reTranslate");
            $("main").modeler("reTranslate");
            $("html").attr("lang", lng);
        };
    }

    function initUI() {
        //		if (app.helper.getParameterByName(unescape('%75%74%6D%5F%73%6F%75%72%63%65'))==unescape('%74%79%63%6F%6E'))$("#nav-advert").remove();
        //history.pushState('', document.title, window.location.pathname);
        const afterReLink = function(from, to) {
            app.helper.tree.rescan();
            $("main").modeler("updateLinks").modeler("updateState");
            $("section[data-original=" + from + "]:visible")[app.model.objects[from].objClass]("update");
            $("section[data-original=" + to + "]:visible")[app.model.objects[to].objClass]("update");
            $("section[data-class=bpCheckPoint]:visible")['bpCheckPoint']("update");
        };
        $("main").modeler({
            objmoved: function(event, data) {
                app.model.objects[data.obj].position = data.offset;
                modelChange(true);
            },
            dragstop: function() {
                api.app.setSnapshot();
                //app.snackbar.show("Object moved", "Undo", app.options.types.messageType.info, api.app.getSnapshot);
            },
            objrenamed: function(event, data) {
                app.model.objects[data.obj].name = data.newname;
                $("main").modeler("renameObj", data.obj);
                $("section[data-original=" + data.obj + "]")[app.model.objects[data.obj].objClass]("update");
                modelChange(true);
                api.app.setSnapshot();
                app.snackbar.show("Object changed", "Undo", app.options.types.messageType.info, api.app.getSnapshot);
            },
            droppedObject: function(event, data) {
                if (data.action == "new") {
                    api.model.items.add(data.objClass, {
                        position: data.position
                    });
                    app.events.add("newObject", data.objClass);
                    api.app.setSnapshot();
                    app.snackbar.show("Object created", "Undo", app.options.types.messageType.info, api.app.getSnapshot);
                    modelChange(true);
                } else if (data.action == "clone") {
                    var source = app.storage.library.get(data.objClass, data.objectId);
                    if (api.model.items.clone($.extend(true, {}, source, {
                            position: data.position
                        }))) {
                        app.events.add("newObject", data.objClass);
                        api.app.setSnapshot();
                        app.snackbar.show("Object created", "Undo", app.options.types.messageType.info, api.app.getSnapshot);
                        modelChange(true);
                    } else
                        app.snackbar.show("Object already exists", null, app.options.types.messageType.info, null);
                }
            },
            addlink: function(event, data) {
                app.core.link(data.from, data.to);
                afterReLink(data.from, data.to);
                api.app.setSnapshot();
                app.snackbar.show("Link created", "Undo", app.options.types.messageType.info, api.app.getSnapshot);
                modelChange(true);
            },
            deletelink: function(event, data) {
                app.core.unlink(data.from, data.to);
                afterReLink(data.from, data.to);
                api.app.setSnapshot();
                app.snackbar.show("Link deleted", "Undo", app.options.types.messageType.info, api.app.getSnapshot);
                modelChange(true);
            },
            objdetail: function(event, id) {
                var obj = app.model.objects[id];
                showDialog("#" + obj.objClass, {
                    obj: id,
                    apply: function(event, eventdata) {
                        if (typeof app.model.objects[id] == 'undefined')
                            return;
                        $.extend(obj, eventdata.result);
                        app.helper.tree.rescan();
                        $("main").modeler("renameObj", obj.id).modeler("updateState");
                        modelChange(true);
                        api.app.setSnapshot();
                        app.snackbar.show("Object changed", "Undo", app.options.types.messageType.info, api.app.getSnapshot);
                    },
                    remove: function() {
                        if (typeof app.model.objects[id] == 'undefined')
                            return;
                        api.model.items.remove(id);
                        $("main").modeler("deleteObj", [id]).modeler("updateLinks").modeler("updateState");
                        api.app.setSnapshot();
                        app.snackbar.show("Object deleted", "Undo", app.options.types.messageType.info, api.app.getSnapshot);
                        modelChange(true);
                    },
                    copy: function() {
                        if (typeof app.model.objects[id] == 'undefined')
                            return;
                        app.helper.clipboard.clear().copy([id]).clone({
                            left: app.options.settings.UI.gridSize * 2 + obj.position.left,
                            top: app.options.settings.UI.gridSize * 2 + obj.position.top
                        });
                        modelChange(true);
                    },
                    close: function() {
                        $("main").modeler("unselect");
                    }
                }, obj.id)
            }
        }).modeler($.extend(true, {}, app.options.settings.UI));
        $("#controlpanel").ctrlpanel({
            activePanel: 0,
            openmodel: function(e, data) {
                app.storage[data].opendialog("application/json,text/xml,.json,.xml,.bpmn,application/x-zip", function(file) {
                    if (file)
                        app.storage[data].load(file, function(content, fileid) {
                            $("main").modeler("clear");
                            api.model.open(content, fileid);
                            api.app.setSnapshot(true);
                            app.events.add("modelAction", "open", app.options.types.storage[data].value);
                            modelChange(false);
                        });
                });
            },
            newmodel: function() {
                newmodel();
            },
            savemodel: function(e, storage) {
                savemodel(storage);
            },
            openDemo: function() {
                openDemo(function() {
                    app.snackbar.show("Demo loaded", null, app.options.types.messageType.info, null);
                });
            },
            newobject: function(event, objClass) {
                var ofs = $("#control [data-text=Design]+ul").offset();
                api.model.items.add(objClass, {
                    position: {
                        top: ofs.top,
                        left: ofs.left + $("#controlpanel").width() + app.options.settings.UI.gridSize
                    }
                });
                api.app.setSnapshot();
                app.snackbar.show("Object created", "Undo", app.options.types.messageType.info, api.app.getSnapshot);
                app.events.add("newObject", objClass);
                modelChange(true);
            },
            showSettings: function() {
                showSettings();
                app.events.screen("Settings");
            },
            showAbout: function() {
                showDialog("#about");
                app.events.screen("About");
            },
            showHelp: function() {
                showDialog("#help");
                app.events.screen("Help");
            },
            exportmodel: function() {
                if (app.helper.exportImgCapability()) {
                    saveSvgAsPng(app.helper.exportimg(), app.model.info.name + '.png');
                    app.events.add("modelAction", "ExportToPNG", "Model");
                } else
                    app.snackbar.show("Feature unsupported by browser", null, app.options.types.messageType.critical, null);
            },
            simulation: function(event, action) {
                if (app.simulation) {
                    simulationaction(action);
                    if (typeof $.ui.floatbtn !== 'undefined')
                        $("#floatbutton").floatbtn("action", action);
                }
            },
            showdashboard: function() {
                showDialog("#dashboard", {
                    exportImage: function(event, data) {
                        if (app.helper.exportImgCapability()) {
                            saveSvgAsPng(data, "Dashboard_" + app.model.info.name + '.png');
                            app.events.add("modelAction", "ExportToPNG", "Dashboard");
                        } else
                            app.snackbar.show("Feature unsupported by browser", null, app.options.types.messageType.critical, null);
                    }
                });
                $(".controlpanel.bpsDashboard").bpsDashboard("update");
                app.events.screen("Dashboard");
            },
            showlog: function() {
                showDialog("#log");
                app.events.screen("Log");
            },
            showreport: function() {
                showDialog("#report");
                app.events.screen("Report");
            },
            changeSimSettings: function(event, data) {
                $.extend(true, app.options.settings.Simulation, data);
                app.options.save();
                app.helper.tree.rescan();
            },
            showlibrary: function() {
                showDialog("#library", {
                    loadobject: function(event, data) {
                        var source = app.storage.library.get(data.type, data.id);
                        if (api.model.items.clone($.extend(true, {}, source, {
                                position: {
                                    top: data.pos.top,
                                    left: data.pos.left
                                }
                            }))) {
                            api.app.setSnapshot();
                            app.snackbar.show("Object created", "Undo", app.options.types.messageType.info, api.app.getSnapshot);
                            app.events.add("newLibObject", data.type);
                        }
                    },
                    onModelUpdate: function() {
                        var id, obj, lib, acted = false;
                        for (id in app.model.objects) {
                            obj = app.model.objects[id];
                            lib = app.storage.library.get(obj.objClass, obj.id);
                            if (lib) {
                                acted = true;
                                $.extend(true, obj, lib);
                                $("main").modeler("renameObj", id);
                            }
                        };
                        if (acted) {
                            $("main").modeler("updateState");
                            api.app.setSnapshot();
                            app.snackbar.show("Model updated", "Undo", app.options.types.messageType.info, api.app.getSnapshot);
                            app.events.add("modelAction", "updateFromLibrary");
                        }
                    },
                    onLibraryUpdate: function() {
                        app.storage.library.update(function(result) {
                            if (result) {
                                $('.bpslibrary:visible').bpsLibrary('update');
                                app.snackbar.show("Library updated", null, app.options.types.messageType.info, null);
                            }
                        });
                    }
                });
            },
            post: function(event, data) {
                var social = data.attr("data-to");
                if (app.post)
                    app.post.post(social, function() {
                        //
                    })
            },
            modelNameChanged: function(event, name) {
                app.model.info.name = name;
                app.events.titleChanged();
            }
        });
        if (typeof $.ui.floatbtn !== 'undefined')
            $("#floatbutton").floatbtn({
                click: function(event, action) {
                    simulationaction(action);
                    $("#controlpanel").ctrlpanel("simaction", action);
                }
            });
        $(document).on("onSimulationprogress", function(event) {
            if (event.progress == 0 && Object.keys(app.model.objects).length > 0 && $.map(app.model.objects, function(obj) {
                    return obj.objClass == app.options.types.objClass.bpGenerator && obj.next.objects.length > 0 ? obj : null
                }).length == 0)
                app.snackbar.show("No tasks to perform", "Add", app.options.types.messageType.info, function() {
                    var mintop = null,
                        topobj = null,
                        fromobj;
                    for (var id in app.model.objects) {
                        if (app.model.objects[id].objType == app.options.types.objType.bpObject && (mintop == null || app.model.objects[id].position.top < mintop)) {
                            topobj = app.model.objects[id];
                            mintop = topobj.position.top;
                        }
                    };
                    if (topobj == null)
                        topobj = api.model.items.add(app.options.types.objClass.bpFunction, {
                            position: {
                                top: app.options.settings.UI.gridSize * 10,
                                left: parseInt(($("#area").width() / 2 - app.options.settings.UI.objectWidth / 2) / app.options.settings.UI.gridSize) * app.options.settings.UI.gridSize
                            }
                        });
                    fromobj = api.model.items.add(app.options.types.objClass.bpGenerator, {
                        position: {
                            top: topobj.position.top - 60 >= 0 ? topobj.position.top - 60 : topobj.position.top,
                            left: topobj.position.top - 60 >= 0 ? topobj.position.left : topobj.position.left + app.options.settings.UI.objectWidth + app.options.settings.UI.gridSize
                        }
                    });
                    app.core.link(fromobj.id, topobj.id);
                    afterReLink(fromobj.id, topobj.id);
                    app.events.add("newObject", app.options.types.objClass.bpGenerator);
                    api.app.setSnapshot();
                    app.snackbar.show("Object created", "Undo", app.options.types.messageType.info, api.app.getSnapshot);
                    modelChange(true);
                });
            $("#controlpanel").ctrlpanel("updateProgress", event.progress, event.time);
            $(".controlpanel.bpsDashboard").bpsDashboard("update");
            $(".controlpanel.bpsReport").bpsReport("update");
            app.simulation.log.onProgress(event);
            $(".controlpanel.bpsLog").bpsLog("update", event.progress);
            $("main").modeler("updateState");
            //Start Simulation           


        });
        bindkeys();
        if (app.loader)
            app.loader.afterinit();
    };

    function bindkeys() {
        $(document).on("keydown", function(event) {
            if (event.ctrlKey && event.which == 67 && window.getSelection && window.getSelection() == "" && $(".selected").length > 0 && $(event.target).filter("#caption,input").length == 0) { // copy
                app.helper.clipboard.clear().copy($(".selected").map(function() {
                    return this.id
                }).get());
                app.snackbar.show(($(".selected").length == 1) ? "The object has copied" : "Objects have copied", null, app.options.types.messageType.info, null);
                event.preventDefault();
            } else if (event.ctrlKey && event.which == 86 && $(event.target).filter("#caption,input").length == 0) { // paste
                var posX = $("main").modeler("option", "selectX"),
                    posY = $("main").modeler("option", "selectY");
                app.helper.clipboard.clone({
                    left: posX,
                    top: posY
                });
                $("main").modeler("updateLinks").modeler("updateState");
                event.preventDefault();
            } else if ((event.which == 46 || event.which == 8) && ($(".selected").length > 0 && $(event.target).filter("#caption,input").length == 0)) { // delete
                $(".selected[id]").each(function() {
                    api.model.items.remove(this.id);
                    if ($("section[data-original=" + this.id + "]").length == 1)
                        $("section[data-original=" + this.id + "]")[$("section[data-original=" + this.id + "]").attr("data-class")]("close");
                });
                $("main").modeler("deleteObj", $(".selected").map(function() {
                    return this.id
                }).get());
                $("main").modeler("updateState");
                api.app.setSnapshot();
                app.snackbar.show("Object deleted", "Undo", app.options.types.messageType.info, api.app.getSnapshot);
                event.preventDefault();
            } else if (event.ctrlKey && event.which == 83) { // save
                savemodel();
                event.preventDefault();
            } else if (event.ctrlKey && !event.shiftKey && event.which == 90) { // undo
                api.app.getSnapshot(false);
            } else if (event.ctrlKey && event.shiftKey && event.which == 90) { // redo
                api.app.getSnapshot(true);
            }
        });
    };

    function openDemo(callback) {
        app.control.startLoading();
        api.model.create();
        app.helper.tree.rescan();
        api.app.setSnapshot(true);
        $("main").modeler("clear");
        modelChange(false);

        $.getJSON("demos/1.json", function(model) {
            model.info.id = app.helper.generateId();
            model.info.created = (new Date()).toUTCString();
            if (model.langpack) {
                for (var id in model.langpack) {
                    Globalize.addCultureInfo(model.langpack[id].lang, {
                        messages: model.langpack[id].messages
                    });
                };
                delete model.langpack;
                for (var id in model.objects) {
                    model.objects[id].name = app.helper.trans(model.objects[id].name)
                };
                model.info.name = app.helper.trans(model.info.name);
            };
            api.model.open(JSON.stringify(model));
            app.options.settings.session.currentFile = null;
        }).always(function() {
            app.control.endLoading();
            callback();
        })
    };

    function newmodel() {
        api.model.create();
        app.helper.tree.rescan();
        api.app.setSnapshot(true);
        $("main").modeler("clear");
        $("#controlpanel").ctrlpanel({
            'modelName': app.model.info.name
        });
        app.events.add("modelAction", "new", null, false);
        app.options.settings.session.currentFile = null;
        app.options.settings.session.lastsavedmodel = null;
        app.options.save();
        app.events.titleChanged();
        modelChange(false)
    };

    function savemodel(storage, callback) {
        var storage = storage || app.options.settings.General.storage;
        app.control.startLoading();
        api.model.save(storage, function(result) {
            app.control.endLoading();
            if (result && !result.error) {
                app.snackbar.show("Model saved", null, app.options.types.messageType.info, null);
                app.options.settings.General.storage = storage;
                if (result.fileid)
                    app.helper.lastOpenedmodel(result.fileid, true);
                modelChange(false);
            } else if (result && result.error) {
                app.snackbar.show(result.error.message, "Contact Support", app.options.types.messageType.critical, app.helper.contactsupport);
                app.events.error("Cloud save error\nmessage: " + result.error.message, true);
            }
            if (callback)
                callback();
        });
        app.events.add("modelAction", "save", app.options.types.storage[storage].value);
    };

    function showDialog(element, option, original) {
        var content = app.helper.loadContent(element);
        if (content.length == 0)
            return false;
        (original) ? content.attr("data-original", original): null;
        return $("#controlpanel").ctrlpanel("addTab", content, option);
    };

    function simulationaction(action) {
        if (app.simulation) {
            app.simulation.control.set(action);
        }
    };

    function modelChange(state) {
        app.core.isChanged = state;
        $("#controlpanel").ctrlpanel("updateModelChanged", state);
    };

    function showSettings() {
        showDialog("#settings", {
            onSettingsChanged: function(event, changed) {
                    app.options.save();
                    if (changed.lang == true) {
                        Globalize.culture(app.options.settings.UI.language);
                        $("#controlpanel").ctrlpanel("reTranslate");
                        $("main").modeler("reTranslate");
                        $("html").attr("lang", app.options.settings.UI.language);
                    };
                    if (changed['interface'] === true) {
                        $("main").modeler("option", $.extend(true, {}, app.options.settings.UI));
                        $("#controlpanel").ctrlpanel("option", "snapToGrid", app.options.settings.UI.snapToGrid);
                    };
                }
                /*
                 * , onDataTransfer : function() { app.storage[app.options.settings.General.storage].transfer(function() { app.snackbar.show("Data moved", null, app.options.types.messageType.info, null); app.events.add("storageAction", "transfer"); }) }
                 */
        });
    }
});