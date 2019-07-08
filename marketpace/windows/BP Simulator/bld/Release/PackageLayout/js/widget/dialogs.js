(function($) {
	$.widget("ui.bpsdialog", {
	  _apply : function() {
		  this.close()
	  },
	  _create : function() {
		  var that = this;
		  /*
			 * $("form", this.element).submit(function(event) { that._apply(); event.preventDefault(); });
			 */
		  this.element.addClass("controlpanel");
		  if (this.options.buttons) {
			  var footer = $("footer", this.element), button;
			  $.each(this.options.buttons, function() {
				  var that = this;
				  button = $("<button>");
				  (this.text === false) ? null : button.attr("data-text", this.text);
				  (this.title) ? button.attr("data-title", this.title) : null;
				  (this.icons && this.icons.primary) ? button.addClass("icon").addClass(this.icons.primary) : null;
				  (this.addclass) ? button.addClass(this.addclass) : null;
				  button.click(function() {
					  that.click();
					  return false
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
	  _destroy : function() {
		  $(this.element).unbind();
		  this._super();
	  },
	  close : function() {
		  this.element.closest("nav").children("ul").find("li[data-class=" + this.element.attr("data-class") + "][data-original=" + this.element.attr("data-original") + "] span").click();
	  }
	});
	// bpsSettings
	$.widget("ui.bpsSettings", $.ui.bpsdialog, {
	  changed : {
	    'interface' : false,
	    lang : false,
	    storage : false,
	    general : false
	  },
	  _apply : function() {
		  if (this.changed['interface'] === true || this.changed.general === true) {
			  app.helper.updateObject(this.element, app.options.settings.UI);
			  app.helper.updateObject(this.element, app.options.settings.General);
			  app.helper.updateObject(this.element, app.options.settings.Library);
			  this._trigger("onSettingsChanged", null, $.extend({}, this.changed));
			  for ( var i in this.changed) {
				  this.changed[i] = false
			  }
			  this._super();
		  }
	  },
	  _create : function() {
		  var that = this;
		  $.extend(this.options, {
		    width : 280,
		    buttons : [{
		      text : "Apply",
		      icons : {
			      primary : "bp-icon-check"
		      },
		      click : function() {
			      that._apply()
		      }
		    }]
		  });
		  app.helper.updateFields(this.element, app.options.settings.UI);
		  app.helper.updateFields(this.element, app.options.settings.General);
		  app.helper.updateFields(this.element, app.options.settings.Library);
		  this._accordion(this.element);
		  $("input,select", this.element).change(function() {
			  that.changed[$(this).closest("fieldset").attr("id")] = true;
			  if ($(this).attr("name") == "language")
				  that.changed.lang = true;
			  else if ($(this).attr("name") == "storage")
				  that.changed.storage = true;
		  });
		  $("#general button", this.element).click(function() {
			  var local = false;
			  if (app.options.settings.General.storage == app.options.types.storage.local.name) {
				  local = true;
				  app.options.settings.General.storage = app.options.types.storage.googleDrive.name;
			  }
			  app.storage.showpicker(function(obj) {
				  $("input[name=fileId]", that.element).val(obj.id).change();
				  $("input[name=fileName]", that.element).val(obj.name);
			  })
			  if (local == true)
				  app.options.settings.General.storage = app.options.types.storage.local.name;
		  })
		  this._super();
	  },
	  _accordion : function(content) {
		  /*
			 * content.accordion({ header : "h4", heightStyle : "content", animate : 0, active : 0 })
			 */
	  },
	  _destroy : function() {
		  $("input,select,button", this.element).unbind();
		  // this.element.accordion("destroy");
		  this._super();
	  }
	});
	// bpsInfo
	$.widget("ui.bpsInfo", $.ui.bpsdialog, {
	  _create : function() {
		  var that = this;
		  this.element.addClass("bpsInfo");
		  if (app.options.userinfo.authorized === true) {
			  var dcd = app.solver.info();
			  $(".unregistered", this.element).hide();
			  $(".authorized", this.element).show();
			  if (dcd.level > 0)
				  $("button[data-text=Upgrade]", this.element).hide();
			  $(".ui-name", this.element).text(app.options.userinfo.name);
			  $(".ui-email", this.element).text(app.options.userinfo.email);
			  $(".ui-plan", this.element).text(app.helper.trans(app.options.subPlan[dcd.level].name));
			  $(".ui-date", this.element).text(dcd.date == 0 || dcd.level == 0 ? app.helper.trans("Forever") : Globalize.format(new Date(dcd.date), "d"));
			  $(".authorized button[data-action]:visible", this.element).click(function() {
				  app.events.add("userAction", "clickLink", $(this).attr("data-text"));
				  $(this).attr("data-action", $(this).attr("data-action").replace('/en/', '/' + app.options.settings.UI.language + '/'));
				  window.location = $(this).attr("data-action");
			  });
		  } else {
			  $(".authorized", this.element).hide();
		  }
		  this._super();
	  },
	  _destroy : function() {
		  $("a,button", this.element).unbind();
		  this._super();
	  }
	});
	// bpsHelp
	$.widget("ui.bpsHelp", $.ui.bpsdialog, {
		_create : function() {
			var $lnk = $("a", this.element);
			if ($lnk.length > 0)
				$lnk.each(function() {
					$(this).attr("href", $(this).attr("href").replace('/en/', '/' + app.options.settings.UI.language + '/')).click(function() {
						app.events.add("userAction", "clickLink", $(this).attr("id"));
					})
				});
			this._super();
		}
	});
	// bpsOpen
	$.widget("ui.bpsOpen", $.ui.bpsdialog, {
	  folderItem : null,
	  modelItem : null,
	  _makeFolder : function(folder) {
		  var item = this.folderItem.clone().attr("data-id", folder.id);
		  $("input", item).attr("id", folder.id);
		  $("label", item).text(folder.name).attr("for", folder.id);
		  this._setDraggable(item);
		  this._setDroppable($("label", item));
		  return item
	  },
	  _makeModel : function(model) {
		  var item = this.modelItem.clone().attr("data-id", model.id);
		  $("a", item).text(model.name).attr("title", Globalize.format(new Date(model.lastSaved), "F"));
		  this._setDraggable(item);
		  return item
	  },
	  _setDraggable : function(element) {
		  element.draggable({
		    snap : true,
		    snapMode : "inner",
		    cancel : "span",
		    revert : "invalid",
		    handle : "a,label",
		    revertDuration : 0,
		    helper : function(event) {
			    return $("<div>" + $("a,label", event.delegateTarget).eq(0).text() + "</div>")
		    },
		    /* containment : $("ul:eq(0)",this.element), */
		    scope : "expl"
		  });
	  },
	  _setDroppable : function(element) {
		  var that = this;
		  element.droppable({
		    scope : "expl",
		    /* greedy : true, */
		    /* activeClass : "ui-state-default", */
		    hoverClass : "ui-state-default",
		    accept : function(draggable) {
			    return $(draggable).parent().get(0) != $(this).get(0)
		    },
		    drop : function(event, ui) {
			    that._trigger("onStorageItemMoved", null, {
			      itemId : $(ui.draggable).attr("data-id"),
			      parentId : ($(this).parent().attr("data-id")) ? $(this).parent().attr("data-id") : 0
			    });
			    if ($(this).parent("li").length == 0)// ul
				    $(this).append(ui.draggable)
			    else {
				    if ($(this).parent().children("ul").length == 0)
					    $(this).parent().append("<ul></ul>");
				    $(this).parent().children("ul:eq(0)").append(ui.draggable);
			    }
			    $(this).parent().children("input:eq(0)").prop("checked", true);
			    that._sortUL($(this).parent().children("ul:eq(0)"));
			    that._setEmptyFolder();
		    }
		  });
	  },
	  _setEmptyFolder : function() {
		  $(".empty", this.element).removeClass("empty");
		  $("li", this.element).has("label").not($("li", this.element).has("li")).children("label").addClass("empty");
	  },
	  _updateList : function(parent) {
		  var item, node;
		  if (parent === undefined) {
			  parent = app.storage.index;
			  node = $("ul:eq(0)", this.element);
		  } else {
			  node = $("#" + parent.id, this.element).parent("li");
			  if (node.children("ul").length == 0)
				  node.append("<ul></ul>");
			  node = node.children("ul:eq(0)");
		  };
		  for (item in parent.content) {
			  if (parent.content[item].content) {// folder
				  this._makeFolder(parent.content[item]).appendTo(node);
				  if (parent.content[item].content.length > 0)
					  this._updateList(parent.content[item]);
			  } else
				  this._makeModel(parent.content[item]).appendTo(node);
		  };
		  this._sortUL(node);
	  },
	  updateIndex : function(force) {
		  var that = this, force = (force) || false, current = $("input:checked:visible:last", this.element).parent().attr("data-id");
		  $("select[name=storage]", this.element).val(app.options.settings.General.storage);
		  $("li", that.element).draggable("destroy").children(".ui-droppable").droppable("destroy");
		  $(".css-treeview", this.element).empty();
		  if (!!force) {
			  app.storage.getIndex(function() {
				  that._updateList(undefined);
				  $("li[data-id=" + current + "]>input", that.element).prop("checked", true).parents("li").children("input").prop("checked", true);
				  that._setEmptyFolder();
			  })
		  } else {
			  that._updateList(undefined);
			  $("li[data-id=" + current + "]>input", that.element).prop("checked", true).parents("li").children("input").prop("checked", true);
			  that._setEmptyFolder();
		  }
	  },
	  makeFolder : function(folder) {
		  this._makeFolder(folder).appendTo($("ul:eq(0)", this.element));
		  this._setEmptyFolder();
		  this._sortUL($("ul:eq(0)", this.element));
		  $("li[data-id=" + folder.id + "]", this.element).children(".ui-icon-rename").click();
	  },
	  _create : function() {
		  var that = this;
		  this.element.find("ul").addClass("css-treeview");
		  this._setDroppable($("ul:eq(0)", this.element));
		  this.folderItem = app.helper.loadContent("#openDialogFolder");
		  this.modelItem = app.helper.loadContent("#openDialogModel");
		  $.extend(this.options, {
		    title : app.helper.trans("Stored Models").concat(" - ", app.helper.trans(app.options.types.storage[app.options.settings.General.storage].value), " ", (app.options.userinfo.email) ? app.options.userinfo.email : ""),
		    buttons : [{
		      text : "New Folder",
		      icons : {
			      primary : "ui-icon-newfolder"
		      },
		      click : function() {
			      that._trigger("onStorageItemNewFolder");
		      }
		    }, {
		      text : "Refresh",
		      icons : {
			      primary : "ui-icon-relodcloud"
		      },
		      click : function() {
			      that.updateIndex(true);
		      }
		    }]
		  });
		  $(this.element).on({
			  click : function(e) {
				  var message, element = $(this);
				  if ($(this).hasClass("bp-icon-remove")) {
					  if ($(this).parent("li").has("label").length == 1 && $(this).parent("li").has("li").length == 0)// emptyfolder
						  that._removeElement(element);
					  else {
						  if ($(this).parent("li").has("label").length == 0)
							  message = "Remove the model?"
						  else
							  message = "Delete the folder and all of contents?"
						  app.helper.showMessage({
						    title : "Confirmation",
						    message : message,
						    onOk : function() {
							    that._removeElement(element);
						    }
						  });
					  }
				  } else if ($(this).hasClass("ui-icon-rename")) {
					  var element = $(this).parent().children("label,a");
					  if (element.is("[contentEditable]"))
						  element.removeAttr("contentEditable");
					  else
						  element.prop("contentEditable", true).attr("data-oldvalue", encodeURI(element.text())).focus();
				  }
			  }
		  }, "span").on({
			  blur : function(e) {
				  var id;
				  if ($(this).is("[contentEditable]")) {
					  id = $(this).parent().attr("data-id");
					  if ($(this).is("[data-oldvalue]") && encodeURI($(this).text()) !== $(this).attr("data-oldvalue")) {
						  that._trigger("onStorageItemRenamed", null, {
						    id : id,
						    name : $(this).text()
						  });
					  }
				  }
			  }
		  }, "label,a").on({
			  click : function(event) {
				  that._trigger("onModelOpen", null, $(this).parent().attr("data-id"));
				  return false;
			  }
		  }, "a");
		  this.updateIndex(!app.options.userinfo.authorized);
		  this._setEmptyFolder();
		  $("select[name=storage]", this.element).val(app.options.settings.General.storage).change(function(event) {
			  $("li", that.element).draggable("destroy").children(".ui-droppable").droppable("destroy");
			  $(".css-treeview", this.element).empty();
			  that._trigger("onStorageSourceChanged", null, $(this).val())
		  });
		  this._super();
	  },
	  _removeElement : function(element) {
		  this._trigger("onStorageItemRemoved", null, element.parent("li").attr("data-id"), true);
		  element.parent().draggable("destroy").children(".ui-droppable").droppable("destroy");
		  element.parent().remove();
		  this._setEmptyFolder();
	  },
	  _sortUL : function(ul) {
		  var listitems = ul.children('li').get();
		  listitems.sort(function(a, b) {
			  var aval = $(a).children("a").length + $(a).children("a,label").text().toUpperCase();
			  var bval = $(b).children("a").length + $(b).children("a,label").text().toUpperCase();
			  return aval.localeCompare(bval.toUpperCase());
		  });
		  $.each(listitems, function(idx, itm) {
			  ul.append(itm);
		  });
	  },
	  _destroy : function() {
		  $(".ui-draggable", this.element).draggable("destroy");
		  $(".ui-droppable", this.element).droppable("destroy");
		  this._super();
	  },
	});
	// bpsModal
	$.widget("ui.bpsModal", {
	  _rnd : 0,
	  _create : function() {
		  var i, $btn, $foot = $("<footer></footer>");
		  this._rnd = Math.random() * 16 | 0;
		  if (this.options.width)
			  this.element.width(this.options.width);
		  $("<div></div>").addClass("modal").attr("data-r", this._rnd).append(this.element).appendTo("body");
		  if (this.options.buttons) {
			  for (i in this.options.buttons) {
				  $btn = $("<button></button>").text(this.options.buttons[i].text).click(this.options.buttons[i].click).appendTo($foot);
			  }
			  this.element.append($foot);
		  }
		  this.element.position({
		    my : "center",
		    at : "center",
		    of : window,
		    collision : "fit"
		  })
	  },
	  destroy : function() {
		  $(".modal[data-r=" + this._rnd + "]").detach();
		  /*
			 * $('#modal')[0].innerHTML=''; $('#modal').remove();
			 */
	  }
	});
	// bpsWelcomewindow
	$.widget("ui.bpsWelcome", $.ui.bpsModal, {
	  options : {
	    width : 350,
	    modal : true
	  },
	  _autolang : false,
	  _makeTitle : function() {
		  return app.helper.trans($($("#about")[0].innerHTML).find("[itemprop=name]").text()).concat(" v.", app.options.appVersion)
	  },
	  _create : function() {
		  var that = this;
		  this._setOption("title", this._makeTitle())
		  this.options.closeText = app.helper.trans("Close");
		  $("select[name=language]", this.element).change(function() {
			  if (that._autolang)
				  app.events.add("userAction", "changeDefaultLang", app.options.settings.UI.language + "->" + $(this).val());
			  app.options.settings.UI.language = $(this).val();
			  app.helper.updateContent(that.element);
			  that._setOption("title", that._makeTitle());
			  that._setOption("closeText", app.helper.trans("Close"));
			  $("html").attr("lang", app.options.settings.UI.language);
			  Globalize.culture(app.options.settings.UI.language);
		  });
		  $("button", this.element).click(function(e) {
			  e.preventDefault();
			  that.close();
		  });
		  var lng = (navigator.browserLanguage || navigator.language || navigator.userLanguage).substring(0, 2).toLowerCase();
		  if ($.inArray(lng, $.map(app.options.types.lang, function(val) {
			  return val.culture
		  })) != -1) {
			  $("select[name=language]", this.element).val(lng).change();
			  this._autolang = true;
		  };
		  $("input[name=open]:disabled", this.element).prop("disabled", app.options.settings.session.lastsavedmodel == null)
		  this._super();
	  },
	  _setOption : function(key, value) {
		  /*
			 * if (key == "lastSavedId" && !!value) $("input[name=open]:disabled").prop("disabled", false).next().text(app.storage.getModelInfo(value).name);
			 */
		  if (key == "title" && !!value)
			  $("header", this.element).text(value)
		  this._super(key, value);
	  },
	  close : function() {
		  this._trigger("openModel", null, {
		    action : $("input[name=open]:checked", this.element).val(),
		    id : this.options.lastSavedId
		  });
		  $("input", this.element).unbind();
		  this.destroy();
	  }
	});
	// bpsLog
	$.widget("ui.bpsLog", $.ui.bpsdialog, {
	  _buff : "",
	  _create : function() {
		  var that = this;
		  $(this.element).on('click', "span:not(:first-child)", function() {
			  var cl = 'log_selected', name = $(this).text();
			  $("." + cl, this.element).removeClass(cl);
			  $('span:contains(' + name + ')').filter(function() {
				  return this.innerHTML == name
			  }).parent().addClass(cl);
		  });
		  $(document).on('logEvent.log', function(event, data) {
			  that._buff += data;
		  });
		  $(document).on("onSimulationprogress.log", function(event) {
			  var i;
			  if (event.progress == 0)
				  $("ul", that.element).empty();
			  $("ul", that.element).append(that._buff);
			  that._buff = "";
		  });
		  this._super();
	  },
	  _destroy : function() {
		  var that = this;
		  $(document).unbind('.log');
		  app.control.startLoading();
		  setTimeout(function() {
			  $(that.element).unbind().children("ul").empty();
			  app.control.endLoading();
		  }, 1);
		  this._super();
	  }
	});
	// bpsLibrary
	$.widget("ui.bpsLibrary", $.ui.bpsdialog, {
	  _create : function() {
		  var that = this, res;
		  $("header a", this.element).click(function() {
			  that.update(false, $(this).attr("data-class"));
			  return false;
		  });
		  $("ul", this.element).on("click", "li", function() {
			  that._trigger("loadobject", event, {
			    type : $(this).attr("data-class"),
			    id : $(this).attr("data-id"),
			    pos : {
			      left : parseInt($(this).offset().left + $(this).width()) + 16 + app.options.settings.UI.gridSize,
			      top : parseInt($(this).offset().top)
			    }
			  });
		  });
		  this.update(false, app.options.types.objClass.bpExecute);
		  $("button[data-text='Update Model']", this.element).click(function() {
			  that._trigger("onModelUpdate");
		  });
		  $("button[data-text='Reload List']", this.element).click(function() {
			  that.update(true, app.options.types.objClass.bpExecute)
		  })
		  this._super();
	  },
	  _destroy : function() {
		  $("header a", this.element).unbind();
		  this._super();
	  },
	  update : function(force, bpClass) {
		  var that = this, res;
		  $("header a", this.element).removeClass("actived").filter("a[data-class=" + bpClass + "]").addClass("actived");
		  $("li", this.element).draggable("destroy").parent().empty();
		  app.storage.library.list(force, function(items) {
			  if (!items || !items[bpClass])
				  return;
			  res = $.map(items[bpClass], function(val) {
				  return {
				    id : val.id,
				    name : val.name
				  }
			  });
			  res.sort(function(a, b) {
				  return a.name.localeCompare(b.name);
			  });
			  $($.map(res, function(val) {
				  return "<li data-id='" + val.id + "' data-class='" + bpClass + "'>" + val.name + "</li>"
			  }).join('')).appendTo($("ul", that.element));
			  $("li", that.element).draggable({
			    cancel : false,
			    appendTo : "main",
			    helper : function(event) {
				    return $("<svg class='" + $(event.currentTarget).attr('data-class') + "' data-action='clone'><rect width='" + app.options.settings.UI.objectWidth + "' height='40'></rect></svg>")
			    },
			    drag : function(event, ui) {
				    var o = $("main"), i = $(ui.helper);
				    if (i.position().top > o.height() - i.height()) {
					    o.height(o.height() + 10);
				    };
				    if (i.position().left > o.width() - i.width()) {
					    o.width(o.width() + 10);
				    }
			    },
			    grid : (app.options.settings.UI.snapToGrid) ? [app.options.settings.UI.gridSize, app.options.settings.UI.gridSize] : false,
			    scope : "newobjects",
			    zIndex : 1001
			  });
		  });
	  }
	});
	// report
	$.widget("ui.bpsReport", $.ui.bpsdialog, {
	  _create : function() {
		  this.update();
		  this._super();
	  },
	  update : function() {
		  var i, obj, tr = "", arr = $.grep($.map(app.model.objects, function(o) {
			  return o
		  }), function(obj) {
			  return obj.objClass == app.options.types.objClass.bpExecute// && obj._simulation && obj._simulation.execTime && obj._simulation.execCost && obj._simulation.utilizationTime
		  }).sort(function(a, b) {
			  return a.name.localeCompare(b.name)
		  });
		  for (i in arr) {
			  obj = arr[i];
			  tr = tr.concat("<tr><td>", obj.name, "</td><td>", (obj._simulation && obj._simulation.execTime) ? obj._simulation.execTime.toString().toHHMMSS() : "00:00:00", "</td><td>", Globalize.format((obj._simulation && obj._simulation.execCost) ? obj._simulation.execCost : 0, "c2"), "</td><td>", Globalize.format((obj._simulation && obj._simulation.execTimeDay && obj._simulation.utilizationTime) ? obj._simulation.execTimeDay / obj._simulation.utilizationTime : 0, "p0"), "</td></tr>")
		  }
		  $("tbody", this.element).empty().append(tr);
	  }
	});
	// advert
	$.widget("ui.bpsAdvert", $.ui.bpsdialog, {
	//
	});
})(jQuery)