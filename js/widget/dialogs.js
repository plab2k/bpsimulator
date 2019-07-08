(function($) {
  "use strict";
  $.widget("ui.bpsdialog", {
    _apply: function() {
      this.close();
    },
    _create: function() {
      var that = this;
      /*
       * $("form", this.element).submit(function(event) { that._apply(); event.preventDefault(); });
       */
      this.element.addClass("controlpanel");
      if (this.options.buttons) {
        var footer = $("footer", this.element),
          button;
        $.each(this.options.buttons, function() {
          var that = this;
          button = $("<button>");
          this.text === false ? null : button.attr("data-text", this.text);
          this.title ? button.attr("data-title", this.title) : null;
          this.icons && this.icons.primary
            ? button.addClass("icon").addClass(this.icons.primary)
            : null;
          this.addclass ? button.addClass(this.addclass) : null;
          button.on("click", function() {
            that.click();
            return false;
          });
          footer.append(button);
        });
        app.helper.updateContent(footer);
        app.helper.linkLabels(this.element);
        // this.element=this.element.after(footer);
        // footer.insertAfter();
        // this.element.parent().append(footer);
      }
      this._super();
    },
    _destroy: function() {
      $(this.element).off();
      this._super();
    },
    close: function() {
      this.element
        .closest("nav")
        .children("ul")
        .find(
          "li[data-class=" +
            this.element.attr("data-class") +
            "][data-original=" +
            this.element.attr("data-original") +
            "] span"
        )
        .trigger("click");
    }
  });
  // bpsSettings
  $.widget("ui.bpsSettings", $.ui.bpsdialog, {
    changed: {
      interface: false,
      lang: false,
      storage: false,
      general: false
    },
    _apply: function() {
      if (this.changed["interface"] === true || this.changed.general === true) {
        app.helper.updateObject(this.element, app.options.settings.UI);
        app.helper.updateObject(this.element, app.options.settings.General);
        this._trigger(
          "onSettingsChanged",
          null,
          $.extend(true, {}, this.changed)
        );
        for (var i in this.changed) {
          this.changed[i] = false;
        }
        this._super();
      }
    },
    _create: function() {
      var that = this;
      $.extend(true, this.options, {
        width: 280,
        buttons: [
          /*
           * { text : "Move data", icons : { primary : "bp-icon-check" }, click : function() { that._trigger("onDataTransfer"); } },
           */
          {
            text: "Apply",
            icons: {
              primary: "bp-icon-check"
            },
            click: function() {
              that._apply();
            }
          }
        ]
      });
      app.helper.updateFields(this.element, app.options.settings.UI);
      app.helper.updateFields(this.element, app.options.settings.General);
      this._accordion(this.element);
      $("input,select", this.element).on("change", function() {
        that.changed[
          $(this)
            .closest("fieldset")
            .attr("id")
        ] = true;
        if ($(this).attr("name") == "language") that.changed.lang = true;
        else if ($(this).attr("name") == "storage") that.changed.storage = true;
      });
      $("input[name=isShowAds]", this.element)
        .prop(
          "checked",
          ["block", "undefined"].indexOf($("#nav-advert").css("display")) > -1
        )
        .on("change", function(event) {
          $(this).prop("checked")
            ? $("#nav-advert").show()
            : $("#nav-advert").hide();
          app.events.add("adChanged", $(this).prop("checked"));
          event.stopPropagation();
        });
      this._super();
    },
    _accordion: function(content) {
      /*
       * content.accordion({ header : "h4", heightStyle : "content", animate : 0, active : 0 })
       */
    },
    _destroy: function() {
      $("input,select,button", this.element).off();
      // this.element.accordion("destroy");
      this._super();
    }
  });

  // bpsHelp
  $.widget("ui.bpsHelp", $.ui.bpsdialog, {
    _create: function() {
      var $lnk = $("a", this.element);
      if ($lnk.length > 0)
        $lnk.each(function() {
          $(this)
            .attr(
              "href",
              $(this)
                .attr("href")
                .replace("/en/", "/" + app.options.settings.UI.language + "/")
            )
            .on("click", function() {
              app.events.add("clickLink", $(this).attr("id"));
            });
        });
      this._super();
    }
  });
  // bpsModal
  $.widget("ui.bpsModal", {
    _rnd: 0,
    _create: function() {
      var i,
        $btn,
        $foot = $("<footer></footer>");
      this._rnd = (Math.random() * 16) | 0;
      if (this.options.width) this.element.css("width", this.options.width);
      $("<div></div>")
        .addClass("modal")
        .attr("data-r", this._rnd)
        .append(this.element)
        .appendTo("body");
      if (this.options.buttons) {
        for (i in this.options.buttons) {
          $btn = $("<button></button>")
            .text(this.options.buttons[i].text)
            .on("click", this.options.buttons[i].click)
            .appendTo($foot);
        }
        this.element.append($foot);
      }
      this.element.position({
        my: "center",
        at: "center",
        of: window,
        collision: "fit"
      });
    },
    destroy: function() {
      $(".modal[data-r=" + this._rnd + "]").detach();
      /*
       * $('#modal')[0].innerHTML=''; $('#modal').remove();
       */
    }
  });
  // bpsWelcomewindow
  $.widget("ui.bpsWelcome", $.ui.bpsModal, {
    options: {
      width: 350,
      modal: true
    },
    _autolang: false,
    _create: function() {
      var that = this;
      this.options.closeText = app.helper.trans("Close");
      $("select[name=language]", this.element).on("change", function() {
        if (that._autolang)
          app.events.add(
            "changeDefaultLang",
            app.options.settings.UI.language + "->" + $(this).val()
          );
        app.options.settings.UI.language = $(this).val();
        app.helper.updateContent(that.element);
        that._setOption("closeText", app.helper.trans("Close"));
        $("html").attr("lang", app.options.settings.UI.language);
        Globalize.culture(app.options.settings.UI.language);
      });
      $("button", this.element).on("click", function(e) {
        e.preventDefault();
        that.close();
      });
      var lng = (
        navigator.browserLanguage ||
        navigator.language ||
        navigator.userLanguage
      )
        .substring(0, 2)
        .toLowerCase();
      if (
        $.inArray(
          lng,
          $.map(app.options.types.lang, function(val) {
            return val.culture;
          })
        ) != -1
      ) {
        $("select[name=language]", this.element)
          .val(lng)
          .trigger("change");
        this._autolang = true;
      }
      $("input[name=open]:disabled", this.element).prop(
        "disabled",
        app.options.settings.session.lastsavedmodel == null
      );
      this._super();
    },
    close: function() {
      this._trigger("openModel", null, {
        action: $("input[name=open]:checked", this.element).val(),
        id: this.options.lastSavedId
      });
      $("input", this.element).off();
      this.destroy();
    }
  });
  // bpsLog
  $.widget("ui.bpsLog", $.ui.bpsdialog, {
    _lastKey: 0,
    _format: function(event) {
      let str = "";
      const obs = function(id) {
          return app.model.objects[id].name;
        },
        tr = app.helper.trans;
      event.time = new Date(event.time);
      switch (event.kind) {
        case app.options.types.eventType.taskNew:
          str = "<span>".concat(
            Globalize.format(event.time, "T"),
            "</span>",
            " <span>",
            tr("Task"),
            " #",
            event.task,
            "</span> ",
            tr("created in"),
            " <span>",
            obs(event.source),
            "</span>"
          );
          break;
        case app.options.types.eventType.taskComplete:
          str = "<span>".concat(
            Globalize.format(event.time, "T"),
            "</span>",
            " <span>",
            tr("Task"),
            " #",
            event.task,
            "</span> ",
            tr("completed in"),
            " <span>",
            obs(event.source),
            "</span>"
          );
          break;
        case app.options.types.eventType.taskDelivered:
          str = "<span>".concat(
            Globalize.format(event.time, "T"),
            "</span>",
            " <span>",
            tr("Task"),
            " #",
            event.task,
            "</span> ",
            tr("delivered to"),
            " <span>",
            obs(event.source),
            "</span>"
          );
          break;
        case app.options.types.eventType.taskAssigned:
          str = "<span>".concat(
            Globalize.format(event.time, "T"),
            "</span>",
            " <span>",
            tr("Task"),
            " #",
            event.task,
            "</span> ",
            tr("assigned to"),
            " <span>",
            obs(event.source),
            "</span>"
          );
          break;
        default:
          break;
      }
      if (str != "")
        str =
          "<div>" +
          str.replace(/<span/, "<span class='e" + event.kind + "'") +
          "</div>";
      return str;
    },
    _create: function() {
      this._logTableName = app.options.keyNames.logTaskName;
      $(this.element).on("click", "span:not(:first-child)", function() {
        var cl = "log_selected",
          name = $(this).text();
        $("." + cl, this.element).removeClass(cl);
        $("span:contains(" + name + ")")
          .filter(function() {
            return this.innerHTML == name;
          })
          .parent()
          .addClass(cl);
      });
      this._super();
      this.update();
    },
    update: function(progress) {
      const that = this;
      let objStore;
      if (progress === 0) {
        that._lastKey = 0;
        $(that.element).empty();
        return;
      }
      if (app.options.db)
        objStore = app.options.db
          .transaction(app.options.db.objectStoreNames)
          .objectStore(this._logTableName);
      else return;
      let request = objStore
        .index("time")
        .getAll(IDBKeyRange.lowerBound(that._lastKey, true));
      let buffer = "";
      request.onsuccess = function(event) {
        let i;
        for (i = 0; i < event.target.result.length; i++) {
          buffer += that._format(event.target.result[i]);
        }
        that._lastKey = i == 0 ? 0 : event.target.result[i - 1].time;
        $(that.element).append(buffer);
        objStore.transaction.close;
      };
    },
    _destroy: function() {
      var that = this;
      $(document).off(".log");
      app.control.startLoading();
      setTimeout(function() {
        $(that.element)
          .off()
          .empty();
        app.control.endLoading();
      }, 1);
      this._super();
    }
  });
  // report
  $.widget("ui.bpsReport", $.ui.bpsdialog, {
    _create: function() {
      var that = this;
      $("header a", this.element).on("click", function() {
        var func = $(this).data("func");
        $("table", that.element).hide();
        $("table[data-func=" + func + "]").show();
        $("a.actived", that.element).removeClass("actived");
        $(this).addClass("actived");
        that[func]();
        return false;
      });
      $("header a:eq(0)", that.element).trigger("click");
      this._super();
    },
    _destroy: function() {
      $("header a", this.element).off();
      this._super();
    },
    update: function() {
      this[$("a.actived", this.element).data("func")]();
    },
    utilisation: function() {
      var i,
        obj,
        tr = "",
        arr = $.grep(
          $.map(app.model.objects, function(o) {
            return o;
          }),
          function(obj) {
            return obj.objClass == app.options.types.objClass.bpExecute; // && obj._simulation && obj._simulation.execTime && obj._simulation.execCost && obj._simulation.utilizationTime
          }
        ).sort(function(a, b) {
          return a.name.localeCompare(b.name);
        });
      for (i in arr) {
        obj = arr[i];
        tr = tr.concat(
          "<tr><td>",
          obj.name,
          "</td><td>",
          obj._simulation && obj._simulation.execTime
            ? obj._simulation.execTime.toString().toHHMMSS()
            : "00:00:00",
          "</td><td>",
          Globalize.format(
            obj._simulation && obj._simulation.execCost
              ? obj._simulation.execCost
              : 0,
            "c2"
          ),
          "</td><td>",
          Globalize.format(
            obj._simulation &&
              obj._simulation.execTimeDay &&
              obj._simulation.utilizationTime
              ? obj._simulation.execTimeDay / obj._simulation.utilizationTime
              : 0,
            "p0"
          ),
          "</td></tr>"
        );
      }
      $("table[data-func=utilisation] tbody", this.element)
        .empty()
        .append(tr);
    },
    matrix: function() {
      var i,
        obj,
        th = "",
        tr = "";
      var arr = $.grep(
        $.map(app.model.objects, function(o) {
          return o;
        }),
        function(obj) {
          return obj.objClass == app.options.types.objClass.bpExecute;
        }
      ).sort(function(a, b) {
        return a.name.localeCompare(b.name);
      });
      for (i in arr) {
        obj = arr[i];
        th = th.concat("<th>", obj.name, "</th>");
      }
      $("table[data-func=matrix] thead", this.element)
        .empty()
        .append("<tr><th></th>" + th + "</tr>");
      var arr2 = $.grep(
        $.map(app.model.objects, function(o) {
          return o;
        }),
        function(obj) {
          return obj.objClass == app.options.types.objClass.bpFunction;
        }
      ).sort(function(a, b) {
        return a.name.localeCompare(b.name);
      });
      for (i in arr2) {
        obj = arr2[i];
        tr += "<tr><td>" + obj.name + "</td>";
        for (var ii in arr) {
          tr += "<td>";
          if (
            $.grep(obj.execute.objects, function(elem) {
              return elem.obj == arr[ii].id;
            }).length > 0
          )
            tr += "X";
          tr += "</td>";
        }
        tr += "</tr>";
        // tr = tr.concat("<td>", obj.name, "</td>");
      }
      $("table[data-func=matrix] tbody", this.element)
        .empty()
        .append(tr);
      // console.log(th)
    }
  });
  // advert
  $.widget("ui.bpsAdvert", $.ui.bpsdialog, {
    //
  });
})(jQuery);
