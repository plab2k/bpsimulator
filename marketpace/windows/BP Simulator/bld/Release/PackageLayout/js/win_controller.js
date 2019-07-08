var app = app || {};
app.control = (function () {
    var loading = 0;
    function initUI() {
        var afterReLink = function (from, to) {
            app.helper.tree.rescan();
            $("main").modeler("updateLinks").modeler("updateState");
            $("section[data-original=" + from + "]:visible")[app.model.objects[from].objClass]("update");
            $("section[data-original=" + to + "]:visible")[app.model.objects[to].objClass]("update");
            $("section[data-class=bpCheckPoint]:visible")['bpCheckPoint']("update");
        };
        $("main").modeler({
            objmoved: function (event, data) {
                app.model.objects[data.obj].position = data.offset;
                modelChange(true);
            },
            objrenamed: function (event, data) {

                app.model.objects[data.obj].name = data.newname;
                $("main").modeler("renameObj", data.obj);
                $("section[data-original=" + data.obj + "]")[app.model.objects[data.obj].objClass]("update");
                modelChange(true);
                api.model.setSnapshot();
                app.snackbar.show("Object changed", "Undo", app.options.types.messageType.info, api.model.getSnapshot);
            },
            modelrenamed: function (event, data) {
                app.model.info.name = data.newname;
                app.storage.renameItem(app.model.info.id, data.newname);
                $("main").modeler("updateModelName");
                app.control.updateFileList();
                modelChange(true);
            },
            droppedObject: function (event, data) {

                if (data.action == "new") {
                    api.model.items.add(data.objClass, {
                        position: data.position
                    });
                    app.events.add("userAction", "newObject", data.objClass);
                    api.model.setSnapshot();
                    app.snackbar.show("Object created", "Undo", app.options.types.messageType.info, api.model.getSnapshot);
                    modelChange(true);
                } else if (data.action == "clone") {
                    var source = app.storage.library.get(data.objClass, data.objectId);
                    if (api.model.items.clone($.extend({}, source, {
                        position: data.position
                    }))) {
                        app.events.add("userAction", "newObject", data.objClass);
                        api.model.setSnapshot();
                        app.snackbar.show("Object created", "Undo", app.options.types.messageType.info, api.model.getSnapshot);
                        modelChange(true);
                    }
                }
            },
            addlink: function (event, data) {

                app.core.link(data.from, data.to);
                afterReLink(data.from, data.to);
                api.model.setSnapshot();
                app.snackbar.show("Link created", "Undo", app.options.types.messageType.info, api.model.getSnapshot);
                modelChange(true);
            },
            deletelink: function (event, data) {

                app.core.unlink(data.from, data.to);
                afterReLink(data.from, data.to);
                api.model.setSnapshot();
                app.snackbar.show("Link deleted", "Undo", app.options.types.messageType.info, api.model.getSnapshot);
                modelChange(true);
            },
            objdetail: function (event, id) {
                var obj = app.model.objects[id];
                showDialog("#" + obj.objClass, {
                    obj: id,
                    apply: function (event, eventdata) {

                        $.extend(obj, eventdata.result);
                        app.helper.tree.rescan();
                        $("main").modeler("renameObj", obj.id).modeler("updateState");
                        modelChange(true);
                        api.model.setSnapshot();
                        app.snackbar.show("Object changed", "Undo", app.options.types.messageType.info, api.model.getSnapshot);
                    },
                    remove: function () {

                        api.model.items.remove(id);
                        $("main").modeler("deleteObj", [id]).modeler("updateLinks").modeler("updateState");
                        api.model.setSnapshot();
                        app.snackbar.show("Object deleted", "Undo", app.options.types.messageType.info, api.model.getSnapshot);
                        modelChange(true);
                    },
                    copy: function () {
                        app.helper.clipboard.clear().copy([id]).clone({
                            left: app.options.settings.UI.gridSize * 2 + obj.position.left,
                            top: app.options.settings.UI.gridSize * 2 + obj.position.top
                        });
                        modelChange(true);
                    },
                    close: function () {
                        $("main").modeler("unselect");
                    }
                }, obj.id)
            }
        }).modeler($.extend({}, app.options.settings.UI));

        $("#controlpanel").ctrlpanel({
            activePanel: 0,
            openmodel: function () {
                app.storage[app.options.settings.General.storage].opendialog([".json",".xml",".bpmn"], function (file) {
                    if (file) {
                        app.control.startLoading();
                        app.storage[app.options.settings.General.storage].load(file, function (content, fileid) {
                            $("main").modeler("clear");
                            api.model.open(content);
                            api.model.setSnapshot(true);
                            if (fileid)
                                app.helper.lastOpenedmodel(fileid)
                            app.events.add("userAction", "modelAction", "open");
                            app.model.info.name = file.displayName;
                            Windows.UI.ViewManagement.ApplicationView.getForCurrentView().title = app.model.info.name;
                            app.control.endLoading();
                        });
                    }
                })
            },
            newmodel: function () {
                newmodel();
            },
            savemodel: function () {
                savemodel();
            },
            newobject: function (event, objClass) {
                var ofs = $("#control .ui-accordion-header-active+ul").offset();

                api.model.items.add(objClass, {
                    position: {
                        top: ofs.top,
                        left: ofs.left + $("#controlpanel").width() + app.options.settings.UI.gridSize
                    }
                });
                api.model.setSnapshot();
                app.snackbar.show("Object created", "Undo", app.options.types.messageType.info, api.model.getSnapshot);

                app.events.add("userAction", "newObject", objClass);
                modelChange(true);
            },
            showSettings: function () {
                showDialog("#settings", {
                    onSettingsChanged: function (event, changed) {
                        app.options.save();
                        if (changed.lang == true) {
                            Globalize.culture(app.options.settings.UI.language);
                            $("#controlpanel").ctrlpanel("reTranslate");
                            $("main").modeler("reTranslate");
                            $("html").attr("lang", app.options.settings.UI.language);
                        };
                        if (changed['interface'] === true) {
                            $("main").modeler("option", $.extend({}, app.options.settings.UI));
                            $("#controlpanel").ctrlpanel("option", "snapToGrid", app.options.settings.UI.snapToGrid);
                        };
                        if (changed.storage === true) {
                            app.events.add("userAction", "ChangeStorage", app.options.settings.General.storage);
                        };
                    },
                    onClearStorage: function (event) {
                        app.options.clearStorage();
                    }
                });
                app.events.screen("Settings");
            },
            showAbout: function () {
                showDialog("#about");
                app.events.screen("About");
            },
            showHelp: function () {
                showDialog("#help");
                app.events.screen("Help");
            },
            exportmodel: function () {
                saveSvgAsPng(app.helper.exportimg(), app.model.info.name + '.png');
                app.events.add("userAction", "modelAction", "ExportToPng");
            },
            simulation: function (event, action) {
                if (app.simulation) {
                    simulationaction(action);
                    if (typeof $.ui.floatbtn !== 'undefined')
                        $("#floatbutton").floatbtn("action", action);
                }
            },
            showdashboard: function () {
                showDialog("#dashboard");
                $(".controlpanel.bpsDashboard").bpsDashboard("update");
                app.events.screen("Dashboard");
            },
            showlog: function () {
                showDialog("#log");
                app.events.screen("Log");
            },
            showreport: function () {
                showDialog("#report");
                app.events.screen("Report");
            },
            copymodel: function () {
                app.model.info.name += " v." + (++app.model.info.revision);
                api.model.copy();
                api.model.setSnapshot(true);
                app.events.add("userAction", "modelAction", "Copy");
                $("main").modeler("updateModelName");
                modelChange(false);
            },
            changeSimSettings: function (event, data) {
                $.extend(app.options.settings.Simulation, data);
                app.options.save();
                app.helper.tree.rescan();
            },
            sharemodel: function () {
                app.options.settings.General.storage = app.options.types.storage.googleDrive.name;
                api.model.save(false, function (response) {
                    api.model.share();
                })
            },
            showlibrary: function () {
                showDialog("#library", {
                    loadobject: function (event, data) {
                        var source = app.storage.library.get(data.type, data.id);

                        if (api.model.items.clone($.extend({}, source, {
                            position: {
                            top: data.pos.top,
                            left: data.pos.left
                        }
                        }))) {
                            api.model.setSnapshot();
                            app.snackbar.show("Object created", "Undo", app.options.types.messageType.info, api.model.getSnapshot);
                            app.events.add("userAction", "newLibObject", data.type);
                        }
                    },
                    onModelUpdate: function () {
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
                            api.model.setSnapshot();
                            app.snackbar.show("Model updated", "Undo", app.options.types.messageType.info, api.model.getSnapshot);
                            app.events.add("userAction", "modelAction", "updateFromLibrary");
                        }
                    }
                });
            },            
            post: function (event, data) {
                var social = data.attr("data-to");
                app.events.add("userAction", "postSocial", social);
                app.control.startLoading();
                if (app.post)
                    app.post.post(social, function () {
                        app.control.endLoading();
                    })
            }
        });

        $(document).on("onSimulationprogress", function (event) {
            if (event.progress == 0 && $.map(app.model.objects, function () {
                    return 1
            }).length > 0 && $.map(app.model.objects, function (obj) {
                    return obj.objClass == app.options.types.objClass.bpGenerator && obj.next.objects.length > 0 ? obj : null
            }).length == 0)
                app.snackbar.show("No tasks to perform", "Add", app.options.types.messageType.info, function () {
                    var mintop = null, topobj = null, fromobj;
                    for (var id in app.model.objects) {
                        if (mintop == null || app.model.objects[id].position.top < mintop) {
                            topobj = app.model.objects[id];
                            mintop = topobj.position.top;
                        }
                    }

                    fromobj = api.model.items.add(app.options.types.objClass.bpGenerator, {
                        position: {
                            top: topobj.position.top - 60 >= 0 ? topobj.position.top - 60 : topobj.position.top,
                            left: topobj.position.top - 60 >= 0 ? topobj.position.left : topobj.position.left + app.options.settings.UI.objectWidth + app.options.settings.UI.gridSize
                        }
                    });
                    app.core.link(fromobj.id, topobj.id);
                    afterReLink(fromobj.id, topobj.id);
                    app.events.add("userAction", "newObject", app.options.types.objClass.bpGenerator);
                    api.model.setSnapshot();
                    app.snackbar.show("Object created", "Undo", app.options.types.messageType.info, api.model.getSnapshot);
                    modelChange(true);
                });
            $("#controlpanel").ctrlpanel("updateProgress", event.progress, event.time);
            $(".controlpanel.bpsDashboard").bpsDashboard("update");
            $(".controlpanel.bpsReport").bpsReport("update");
            $("main").modeler("updateState");
        });
        bindkeys();
        if (app.loader)
            app.loader.afterinit();
    };

    function bindkeys() {
        $(document).bind("keydown", function (event) {
            if (event.ctrlKey && event.which == 67 && window.getSelection && window.getSelection() == "" && $(".selected").length > 0) {// copy
                app.helper.clipboard.clear().copy($(".selected").map(function () {
                    return this.id
                }).get());
                app.snackbar.show(($(".selected").length == 1) ? "The object has copied" : "Objects have copied", null, app.options.types.messageType.info, null);
                event.preventDefault();
            } else if (event.ctrlKey && event.which == 86) {// paste
                var posX = $("main").modeler("option", "selectX"), posY = $("main").modeler("option", "selectY");
                app.helper.clipboard.clone({
                    left: posX,
                    top: posY
                });
                $("main").modeler("updateLinks").modeler("updateState");
                event.preventDefault();
            } else if (event.which == 46) {// delete
                if ($(".selected").length == 0)
                    return;

                $(".selected[id]").each(function () {
                    api.model.items.remove(this.id);
                });
                $("main").modeler("deleteObj", $(".selected").map(function () {
                    return this.id
                }).get());
                $("main").modeler("updateState");
                api.model.setSnapshot();
                app.snackbar.show("Object deleted", "Undo", app.options.types.messageType.info, api.model.getSnapshot);
                event.preventDefault();
            } else if (event.ctrlKey && event.which == 83) {// save
                savemodel();
                event.preventDefault();
            } else if (event.ctrlKey && !event.shiftKey && event.which == 90) {// undo
                api.model.getSnapshot(false);
            } else if (event.ctrlKey && event.shiftKey && event.which == 90) {// redo
                api.model.getSnapshot(true);
            }
        });
    };

    function newmodel() {
        api.model.create();
        app.helper.tree.rescan();
        api.model.setSnapshot(true);
        $("main").modeler("clear").modeler("updateModelName");
        app.model.info.name = app.helper.trans("New Model");
        Windows.UI.ViewManagement.ApplicationView.getForCurrentView().title = app.model.info.name;
        app.events.add("userAction", "modelAction", "new");
        modelChange(false)
    };
    function savemodel(callback) {
        app.control.startLoading();
        api.model.save(function (result) {
            app.control.endLoading();
            if (result && !result.error) {
                app.snackbar.show("Model saved", null, app.options.types.messageType.info, null);
                /*
				 * if (app.storage.library) app.storage.library.update();
				 */
                if (result.fileid)
                    app.helper.lastOpenedmodel(result.fileid);
                if (result.name) {
                    app.model.info.name = result.name;
                    Windows.UI.ViewManagement.ApplicationView.getForCurrentView().title = app.model.info.name;
                }
                    
            } else if (result && result.error) {
                app.snackbar.show(result.error.message, null, app.options.types.messageType.critical, null);
            }
            if (callback)
                callback();
        });
        app.events.add("userAction", "modelAction", "save");
    };
    function showDialog(element, option, original) {
        var content = app.helper.loadContent(element);
        if (content.length == 0)
            return false;
        (original) ? content.attr("data-original", original) : null;
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
    }
    return {
        update: function () {
            app.helper.tree.rescan();
            $("main").modeler("addObj", $.map(app.model.objects, function (val) {
                return val.id
            })).modeler("updateModelName").modeler("updateLinks").modeler("updateState");
        },
        updateFileList: function () {
            $("section[data-class=bpsOpen].controlpanel").bpsOpen("updateIndex", false);
        },
        addElement: function (obj, nameType) {
            switch (nameType) {
                case app.options.types.nameType.create:
                    obj.name = app.helper.trans(obj.name) + " " + ($("main ." + obj.objClass).not("svg").length + 1);
                    break;
                case app.options.types.nameType.copy:
                    obj.name = app.helper.trans("Copy of").concat(" ", obj.name);
                    break;
            };
            $("main").modeler("addObj", [obj.id]);
        },
        startLoading: function () {
            if (loading == 0)
                $("#preloader").show();
            loading++;
        },
        endLoading: function () {
            loading--;
            if (loading == 0)
                $("#preloader").hide();
        },
        onError: function (msg) {
            loading = 1;
            app.control.endLoading();
        },
        init: function (lang) {
            /* init */

            app.options.load();
            if (lang)
                app.options.settings.UI.language = lang;
            app.options.settings.General.storage = app.options.types.storage.local.name;
            $("#preloader").hide();
            initUI();
            api.model.create();
            //api.model.setSnapshot(true);
            $("main").modeler("updateModelName");
            var thisPackage = Windows.ApplicationModel.Package.current;
            var version = thisPackage.id.version;
            var appVersion = version.major + "." +
                             version.minor + "." +
                             version.build + "." +
                             version.revision;
            $("[itemprop=softwareVersion]").text(appVersion);

        },
        openDemo: function (callback) {
            app.control.startLoading();
            $.getJSON("ms-appx:///demos/1.json", function (model) {
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
                var i, minleft = null;
                for (i in model.objects) {
                    if (model.objects[i].objClass !== app.options.types.objClass.bpComment)
                        minleft = minleft ? Math.min(minleft, model.objects[i].position.left) : model.objects[i].position.left;
                }
                for (i in model.objects) {
                    model.objects[i].position.left = Math.max(0, model.objects[i].position.left - minleft + app.options.settings.UI.gridSize);
                }
                api.model.open(JSON.stringify(model));
                api.model.setSnapshot(true);
                Windows.UI.ViewManagement.ApplicationView.getForCurrentView().title = app.model.info.name;
                app.options.settings.session.currentFile = null;
                app.control.endLoading();
                callback();
            });
        },
        showDialog: function (dialog) {
            showDialog(dialog);
        }
    }
}());

