;
(function($) {
    // base
    $.widget("ui.basedetail", $.ui.bpsdialog, {
        options: {
            obj: null
        },
        _changed: false,
        _resObj: {},
        _create: function() {
            var that = this;
            this._resObj = $.extend(true, {}, this._obj());
            $.extend(true, this.options, {
                buttons: [{
                    text: "Delete",
                    icons: {
                        primary: "bp-icon-remove"
                    },
                    click: function() {
                        that._delete()
                    }
                }, {
                    text: "Copy",
                    icons: {
                        primary: "bp-icon-remove"
                    },
                    click: function() {
                        that._trigger("copy");
                        that.close();
                    }
                }, {
                    text: "Apply",
                    icons: {
                        primary: "bp-icon-check"
                    },
                    click: function() {
                        that._apply()
                    }
                }]
            });
            this.element.on({
                change: function() {
                    that._afterChange()
                }
            }, "input,select");
            this._super();
            $("footer button:eq(2)", this.element).addClass("disabled");
        },
        _destroy: function() {
            $("*", this.element).off();
            this._trigger("close");
            this._super();
        },
        _apply: function() {
            if (this._changed == true) {
                app.helper.updateObject(this.element, this._resObj);
                this._trigger("apply", null, {
                    result: this._resObj
                });
                this.close();
            }
        },
        _delete: function() {
            this._trigger("remove");
            this.close();
        },
        update: function() {
            app.helper.updateFields(this.element, this._obj());
        },
        _obj: function() {
            return app.model.objects[this.options.obj]
        },
        _afterChange: function() {
            this._changed = true;
            $("footer button:eq(2)", this.element).removeClass("disabled");
        },
        _accordion: function(content) {
            content.accordion({
                header: "h4",
                heightStyle: "content",
                animate: 0,
                active: 0
            })
        }
    });
    // outputer
    $.widget("ui.bpOutputer", $.ui.basedetail, {
        _create: function() {
            $(this.element).on("change", "input[name=allocLogic]", function(event) {
                $("input[name=allocationPercent]", this.element).prop("disabled", this.value == app.options.types.logic.AND)
            });
            this.element.on("change", "input[name=transferTimeMin]", function() {
                $("input[name=transferTimeMax]", $(this).parent()).attr("min", $(this).val()).val((parseInt($(this).val()) > parseInt($("input[name=transferTimeMax]", $(this).parent()).val())) ? $(this).val() : $("input[name=transferTimeMax]", $(this).parent()).val());
            });
            this.element.on("change", "input[name=transferTimeMax]", function() {
                $(this).val(Math.max(parseInt($(this).val()), parseInt($("input[name=transferTimeMin]", $(this).parent()).val())));
            });
            this._super();
        },
        _destroy: function() {
            this.element.off();
            this._super();
        },
        update: function() {
            var content = $("div"),
                item = "",
                template = app.helper.loadContent("#customerItem"),
                obj;
            $(".nextList li", this.element).remove();
            $.each(this._obj().next.objects, function() {
                obj = app.model.objects[this.obj]
                item = template.clone();
                $("input[name=transferTimeMin]", item).attr("value", this.transferTimeMin || 0);
                $("input[name=transferTimeMax]", item).attr("value", this.transferTimeMax || 0);
                $("select[name=delMult]", item).val(this.transferMult);
                $("input[name=allocationPercent]", item).attr("value", this.allocationPercent);
                $(item).prepend("<h5>" + obj.name + "</h5>");
                $(".nextList", this.element).append(item.wrap("<li>").attr("data-objid", obj.id));
            });
            $("input[name=allocLogic]", this.element).val([this._obj().next.allocLogic]).prop("disabled", this._obj().next.objects.length < 2);
            $("input[name=allocationPercent]", this.element).prop("disabled", (this._obj().next.allocLogic == app.options.types.logic.AND))
            this._super();
        },
        _apply: function() {
            var that = this;
            this._resObj.next.objects = [];
            $(".nextList>li", this.element).each(function() {
                that._resObj.next.objects.push({
                    obj: $(this).attr("data-objid"),
                    transferTimeMin: parseInt($("input[name=transferTimeMin]", this).val() || 0),
                    transferTimeMax: parseInt($("input[name=transferTimeMax]", this).val() || 0),
                    transferMult: parseInt($("select[name=delMult]", this).val()),
                    allocationPercent: parseInt($("input[name=allocationPercent]", this).val())
                });
            });
            this._resObj.next.allocLogic = parseInt($("input[name=allocLogic]:checked", this.element).val());
            this._super();
        }
    });
    // function
    $.widget("ui.bpFunction", $.ui.bpOutputer, {
        _create: function() {
            var that = this;
            this._super();
            $(".prevList", this.element).sortable({
                stop: function(event, ui) {
                    that._afterChange()
                },
                axis: "y",
                containment: "parent",
            });
            $("input[name=runTimeMin]", this.element).on("change", function() {
                $("input[name=runTimeMax]", that.element).attr("min", $(this).val()).val((parseInt($(this).val()) > parseInt($("input[name=runTimeMax]", that.element).val())) ? $(this).val() : $("input[name=runTimeMax]", that.element).val());
            });
            $("input[name=runTimeMax]", this.element).on("change", function() {
                $(this).val(Math.max(parseInt($(this).val()), parseInt($("input[name=runTimeMin]", that.element).val())));
            });
            $(this.element).on("change", "input[name=costPerTask]", function(event) {
                $(this).closest("li").children("input[name=costValue]").prop("disabled", !$(this).prop("checked"))
            });
            this._accordion(this.element);
            this.update();
        },
        update: function() {
            var content = "",
                obj;
            var resTmpl = app.helper.loadContent("#resourceItem"),
                supTmpl = app.helper.loadContent("#supportItem");
            var updateRes = function(item) {
                var obj = app.model.objects[item.obj];
                var resItem = resTmpl.clone();
                resItem.attr("data-objid", obj.id).attr("data-objclass", obj.objClass).children("h5").text(obj.name);
                $("input[name=costPerTask]", resItem).prop("checked", item.costPerTask);
                $("input[name=costValue]", resItem).val(item.costValue).prop("disabled", !!!item.costPerTask);
                $("input[name=priority]", resItem).val(item.priority);
                $(".resourceList", this.element).append(resItem);
            };
            var updateSup = function(item) {
                var obj = app.model.objects[item.obj];
                var resItem = supTmpl.clone();
                resItem.attr("data-objid", obj.id).attr("data-objclass", obj.objClass).children("h5").text(obj.name);
                $("input[name=costPerTask]", resItem).prop("checked", item.costPerTask);
                $("input[name=costValue]", resItem).val(item.costValue).prop("disabled", !!!item.costPerTask);
                $(".supportList", this.element).append(resItem);
            }
            $(".prevList>li", this.element).remove();
            $.each(this._obj().prior.objects, function() {
                obj = app.model.objects[this.obj];
                content += "<li data-objid=" + obj.id + "><h5>" + obj.name + "</h5></li>"
            });
            $(".prevList", this.element).append(content);
            $("input[name=execLogic]", this.element).val([this._obj().prior.execLogic]);
            if (this._obj().prior.objects.length > 1) {
                $(".prevList", this.element).sortable("enable");
                $("input[name=execLogic]", this.element).prop("disabled", false);
            } else {
                $(".prevList", this.element).sortable("disable");
                $("input[name=execLogic]", this.element).prop("disabled", true);
            }
            // resource List
            $("input[name=execResource]", this.element).prop("checked", this._obj().execute.execResource == app.options.types.execResource.JOINTLY).prop("disabled", this._obj().execute.objects.length < 2);
            content = "";
            $(".resourceList>li,.supportList>li", this.element).remove();
            $.each(this._obj().execute.objects, function() {
                updateRes(this)
            });
            $.each(this._obj().support.objects, function() {
                updateSup(this)
            });
            this._super();
        },
        _apply: function() {
            var that = this,
                resobj, i = 0;
            this._resObj.prior.objects = [];
            $(".prevList li", this.element).each(function() {
                that._resObj.prior.objects.push({
                    obj: $(this).attr("data-objid")
                });
            });
            this._resObj.prior.execLogic = parseInt($("input[name=execLogic]:checked", this.element).val());
            // resource list
            if ($(".resourceList li,.supportList li", this.element).length > 0) {
                this._resObj.execute.objects = [];
                this._resObj.support.objects = [];
                $(".resourceList li, .supportList li", this.element).each(function() {
                    resobj = {
                        obj: $(this).attr("data-objid"),
                        costPerTask: $("input[name=costPerTask]", this).prop("checked"),
                        costValue: $("input[name=costValue]", this).val() == "" ? 0 : parseFloat($("input[name=costValue]", this).val())
                    };
                    if ($("input[name=priority]", this).length == 1)
                        resobj.priority = $("input[name=priority]", this).val() == "" ? 0 : parseInt($("input[name=priority]", this).val());
                    if ($(this).attr("data-objclass") == app.options.types.objClass.bpExecute)
                        that._resObj.execute.objects.push(resobj)
                    else
                        that._resObj.support.objects.push(resobj)
                });
            }
            if ($("input[name=execResource]", this.element).length == 1)
                this._resObj.execute.execResource = $("input[name=execResource]", this.element).prop("checked") ? app.options.types.execResource.JOINTLY : app.options.types.execResource.ALTERNATE;
            this._super();
        },
        _destroy: function() {
            $(".prevList", this.element).sortable("destroy");
            this._super();
        }
    });
    // generator
    $.widget("ui.bpGenerator", $.ui.bpOutputer, {
        _create: function() {
            var that = this;
            this._super();
            this._accordion(this.element);
            $(".tr", this.element).timeranges({
                countable: true,
                list: this._obj().timeRanges,
                changed: function() {
                    that._afterChange();
                }
            });
            this.update();
        },
        update: function() {
            $(".tr", this.element).timeranges("update");
            this._super();
        },
        _apply: function() {
            if ($(".tr", this.element).length > 0) {
                $(".tr", this.element).timeranges("apply");
                this._resObj.timeRanges = $(".tr", this.element).timeranges("option", "list");
            }
            this._super();
        },
        _destroy: function() {
            $(".tr", this.element).timeranges("destroy");
            this._super();
        }
    });
    // procedure
    $.widget("ui.bpProcedure", $.ui.bpOutputer, {
        _create: function() {
            this._super();
            this.update();
        }
    });
    // Checkpoint
    $.widget("ui.bpCheckPoint", $.ui.basedetail, {
        item: null,
        emptyitem: null,
        _create: function() {
            var that = this;
            this._accordion(this.element);
            this.item = app.helper.loadContent("#fileteredListItem");
            this.emptyitem = app.helper.loadContent("#fileteredEmptyListItem");
            $("button[data-text=Add]").on("click", function() {
                that._addItemtoList($("select[name=addGenerator]", this.element).val());
                that._afterChange();
                return false;
            });
            $(".fileteredList", this.element).on("click", ".bp-icon-remove", function() {
                $(this).parent().remove();
                if ($(".fileteredList li", this.element).length == 0) {
                    that._addItemtoList(null);
                    that._afterChange();
                }
            })
            this._super();
            this.update();
        },
        _addItemtoList: function(id) {
            if ((typeof id == 'undefined' || typeof app.model.objects[id] == 'undefined' || typeof app.model.objects[id].id == 'undefined') && id != null) {
                try {
                    throw new Error('Item objects not found');
                } catch (err) {
                    app.events.error("name: " + err.name + "\nmessage: " + err.message + "\nstack: " + err.stack, true);
                }
            }
            var item, obj = (id !== null) ? app.model.objects[id] : null;
            if (obj !== null && $(".fileteredList li[data-genid=" + obj.id + "]", this.element).length == 0) {
                item = this.item.clone();
                $("span:eq(0)", item).text(obj.name).parent().attr("data-genid", obj.id);
                $(".fileteredList", this.element).append(item);
                $(".fileteredList .empty", this.element).remove();
            } else if (obj == null) {
                item = this.emptyitem.clone();
                $(".fileteredList", this.element).append(item);
            }
        },
        update: function() {
            var $select = $("select[name=addGenerator]", this.element).empty();
            $select.append($.map(app.model.objects, function(val) {
                return (val.objClass === app.options.types.objClass.bpGenerator) ? "<option value=" + val.id + ">" + val.name + "</option>" : null
            }).join(""));
            if (this._obj().allowFilter.length > 0)
                for (var item in this._obj().allowFilter)
                    this._addItemtoList(this._obj().allowFilter[item])
            else
                this._addItemtoList(null)
            this._super();
        },
        _apply: function() {
            this._resObj.allowFilter = $.map($(".fileteredList li", this.element).not('.empty'), function(item) {
                return $(item).attr("data-genid")
            })
            this._super();
        },
        _destroy: function() {
            $("button[data-text=Add]").off();
            this._super();
        }
    });
    // event
    $.widget("ui.bpEvent", $.ui.basedetail, {
        _create: function() {
            this._super();
            this.update();
        }
    });
    // InOut
    $.widget("ui.bpInOut", $.ui.basedetail, {
        _create: function() {
            this._super();
            this.update();
        }
    });
    // regulate
    $.widget("ui.bpRegulate", $.ui.basedetail, {
        _create: function() {
            this._super();
            this.update();
        }
    });
    // execute
    $.widget("ui.bpExecute", $.ui.basedetail, {
        _create: function() {
            var that = this;
            $(".tr", this.element).timeranges({
                countable: false,
                list: this._obj().timeRanges,
                changed: function() {
                    that._afterChange();
                }
            });
            this._super();
            this.update();
        },
        update: function() {
            $(".tr", this.element).timeranges("update");
            this._super();
        },
        _apply: function() {
            if ($(".tr", this.element).length > 0) {
                $(".tr", this.element).timeranges("apply");
                this._resObj.timeRanges = $(".tr", this.element).timeranges("option", "list");
            }
            this._super();
        },
        _destroy: function() {
            $(".tr", this.element).timeranges("destroy");
            this._super();
        }
    });
    // support
    $.widget("ui.bpSupport", $.ui.basedetail, {
        _create: function() {
            this._super();
            this.update();
        }
    });
    // comment
    $.widget("ui.bpComment", $.ui.basedetail, {
        _create: function() {
            this._super();
            this.update();
        }
    });
})(jQuery)