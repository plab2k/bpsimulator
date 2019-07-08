;
app.storage.library = (function() {
    var LIBNAME = 'Object library',
        FILEEXT = ".json";
    var _library = null;
    var init = function(force, callback) {
        var force = force || false;
        if (app.options.settings.Library.fileId && (_library === null || force))
            app.storage[app.options.settings.General.storage].loadLibrary({
                fileId: app.options.settings.Library.fileId
            }, function(response) {
                if (response && !response.error) {
                    _library = response ? typeof data === 'string' ? JSON.parse(response) : response : {};
                } else {
                    app.options.settings.Library.fileId = null
                }
                callback();
            });
        else {
            _library = _library || {};
            callback();
        }
    };
    var prepare = function(obj) {
        var clone = $.extend(true, {}, obj),
            fields = app.options.types.objResFields.concat('prior', 'next');
        delete clone._calc;
        delete clone._simulation;
        delete clone.position;
        for (var field in fields) {
            if (clone[fields[field]])
                clone[fields[field]].objects = [];
        }
        return clone
    }
    return {
        compare: function() {
            init(function() {
                var objid, clone
                for (var objid in app.model.objects) {
                    // app.model.objects[objid]
                }
            });
        },
        list: function(force, callback) {
            init(force, function() {
                callback(_library)
            });
        },
        get: function(type, id) {
            return (_library[type] && _library[type][id]) ? _library[type][id].source : null
        },
        update: function(callback) {
            var res, clone;
            init(true, function() {
                res = _library || {};
                $.each($.map(app.model.objects, function(obj) {
                    return (obj.objType === app.options.types.objType.bpSubject && obj.objClass !== app.options.types.objClass.bpComment) ? obj : null
                }), function() {
                    clone = prepare(this);
                    res[clone.objClass] = res[clone.objClass] || {};
                    res[clone.objClass][clone.id] = {
                        id: clone.id,
                        name: clone.name,
                        source: clone
                    };
                });
                app.storage[app.options.settings.General.storage].saveLibrary({
                    content: JSON.stringify(res),
                    name: app.options.settings.Library.fileId ? null : app.helper.trans(LIBNAME),
                    extention: "json",
                    fileId: app.options.settings.Library.fileId ? app.options.settings.Library.fileId : null
                }, function(result) {
                    if (result && result.fileid && result.fileid != app.options.settings.Library.fileId) {
                        app.options.settings.Library.fileId = result.fileid;
                        app.options.save();
                    } else {
                        app.options.settings.Library.fileId = null;
                        app.options.save();
                    }
                    callback(result);
                });
            });
        }
    }
}());
// bpsLibrary
$.widget("ui.bpsLibrary", $.ui.bpsdialog, {
    _create: function() {
        var that = this,
            res;
        $("header a", this.element).on("click", function() {
            that.update(false, $(this).attr("data-class"));
            return false;
        });
        $("ul", this.element).on("click", "li", function() {
            that._trigger("loadobject", event, {
                type: $(this).attr("data-class"),
                id: $(this).attr("data-id"),
                pos: {
                    left: parseInt($(this).offset().left + $(this).width()) + 16 + app.options.settings.UI.gridSize,
                    top: parseInt($(this).offset().top)
                }
            });
        });
        $("a[data-text='Library']", this.element).on("click", function() {
            app.storage[app.options.settings.General.storage].opendialog('application/json,.json', function(obj) {
                if (obj && obj.id) {
                    app.options.settings.Library.fileId = obj.id;
                    app.options.save();
                    that.update(true, app.options.types.objClass.bpExecute);
                }
            });
            return false;
        });
        $("a[data-text='Update Model']", this.element).on("click", function() {
            that._trigger("onModelUpdate");
            return false;
        });
        $("a[data-text='Update Library']", this.element).on("click", function() {
            that._trigger("onLibraryUpdate");
            return false;
        });
        this.update(false, app.options.types.objClass.bpExecute);
        this._super();
    },
    _destroy: function() {
        $("header a,button", this.element).off();
        this._super();
    },
    update: function(force, bpClass) {
        var that = this,
            res, force = force || false,
            bpClass = bpClass || $("a.actived", this.element).data("class");
        $("header a", this.element).removeClass("actived").filter("a[data-class=" + bpClass + "]").addClass("actived");
        $("li", this.element).draggable("destroy").parent().empty();
        app.storage.library.list(force, function(items) {
            if (!items || !items[bpClass])
                return;
            res = $.map(items[bpClass], function(val) {
                return {
                    id: val.id,
                    name: val.name
                }
            });
            res.sort(function(a, b) {
                return a.name.localeCompare(b.name);
            });
            $($.map(res, function(val) {
                return "<li data-id='" + val.id + "' data-class='" + bpClass + "'>" + val.name + "</li>"
            }).join('')).appendTo($("ul", that.element));
            $("li", that.element).draggable({
                cancel: false,
                appendTo: "main",
                helper: function(event) {
                    return $("<svg class='" + $(event.currentTarget).attr('data-class') + "' data-action='clone'><rect width='" + app.options.settings.UI.objectWidth + "' height='40'></rect></svg>")
                },
                drag: function(event, ui) {
                    var o = $("main"),
                        i = $(ui.helper);
                    if (i.position().top > o.height() - i.height()) {
                        o.height(o.height() + 10);
                    };
                    if (i.position().left > o.width() - i.width()) {
                        o.width(o.width() + 10);
                    }
                },
                grid: (app.options.settings.UI.snapToGrid) ? [app.options.settings.UI.gridSize, app.options.settings.UI.gridSize] : false,
                scope: "newobjects",
                zIndex: 1001
            });
        });
    }
});