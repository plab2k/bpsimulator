$(function() {
	$.widget("bps.ctrlpanel", {
	  options : {
	    disabled : false,
	    activePanel : 0,
	    snapToGrid : true
	  },
	  _create : function() {
		  var that = this;
		  app.helper.updateContent(this.element);
		  if (app.solver && app.solver.solve(app.options.types.functions.advert) === false)
			  $("#nav-advert", this.element).remove();
		  this.element/* .css( "right","auto" ) */.draggable({
		    handle : ".cp_drag",
		    cancel : "a,button",
		    cursor : "move"
		  });
		  this.element.tabs();
		  $("#control", this.element).accordion({
		    header : "figcaption",
		    heightStyle : "content",
		    animate : 0,
		    active : this.options.activePanel,
		    beforeActivate : function(event, ui) {
			    that.closeSub();
			    $(".ui-accordion-header.ui-state-active", that.element).not(ui.newHeader).not(ui.oldHeader).toggleClass("ui-state-active ui-corner-all ui-corner-top").attr('aria-expanded', 'false').attr('aria-selected', 'false').attr('tabIndex', -1).find('span.ui-icon').toggleClass('ui-icon-triangle-1-e ui-icon-triangle-1-s').closest('figcaption').next('ul,div').hide();
		    }
		  });
		  $("#nav-model a, #nav-view a", this.element).click(function(event) {// Model and View
			  that.closeSub();
			  if ($(this).attr("data-action") == "expandmenu") {
				  var off = $(this).offset();
				  $(this).closest("figure").children(".submenu").show().offset({
					  top : off.top
				  }).hide().slideToggle("fast")
			  } else
				  that._trigger($(this).attr("data-action"), null, $(this));
			  return false;
		  });
		  if (app.solver && app.solver.solve(app.options.types.functions.simulation) === false)
			  $("#nav-simulate", this.element).addClass("inactived");
		  $("#nav-simulate a", this.element).click(function(event) {// Simulation
			  if (app.solver && app.solver.solve(app.options.types.functions.simulation) === true) {
				  $(this).closest("ul").find(".pushed").removeClass("pushed");
				  $(this).filter("[data-canpushed]").addClass("pushed");
				  that._trigger("simulation", null, $(this).attr("data-action"));
				  that.closeSub();
			  } else {
				  // app.snackbar.show("", null, app.options.types.messageType.info,null);
			  }
			  return false;
		  });
		  $("#nav-design a", this.element).click(function(event) {// Design
			  that.closeSub();
			  that._trigger("newobject", event, $(this).attr("data-class"));
			  return false;
		  }).draggable({
		    cancel : false,
		    appendTo : "main",
		    helper : function(event) {
			    return $("<svg class='" + $(event.currentTarget).attr('data-class') + "' data-action='new'><rect width='" + app.options.settings.UI.objectWidth + "' height='40'></rect></svg>")
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
		  $("#controlpanel>ul").on({// close tab
			  click : function() {
				  var panelId = $(this).closest("li").remove().attr("aria-controls");
				  $("#" + panelId)[$("#" + panelId).attr("data-class")]("destroy").remove();
				  that.element.tabs("refresh");
			  }
		  }, ".cp-icon-close");
		  var hours = Math.floor(app.options.settings.Simulation.simstartSeconds / 3600), secs = Math.floor((app.options.settings.Simulation.simstartSeconds - (hours * 3600)) / 60);
		  $("input[name=simstartSeconds]", this.element).val("0".concat(hours).substr(-2, 2) + ":" + "0".concat(secs).substr(-2, 2));
		  $("input[name=simdurationVal]", this.element).val(app.options.settings.Simulation.simdurationVal);
		  $("select[name=simdurationMult]", this.element).val(app.options.settings.Simulation.simdurationMult);
		  $("input[name=simstartSeconds],input[name=simdurationVal],select[name=simdurationMult]", this.element).change(function() {
			  that._trigger("changeSimSettings", null, {
			    simstartSeconds : $("input[name=simstartSeconds]", that.element).val().split(":")[0] * 60 * 60 + $("input[name=simstartSeconds]", that.element).val().split(":")[1] * 60,
			    simdurationVal : parseInt($("input[name=simdurationVal]", that.element).val()),
			    simdurationMult : parseInt($("select[name=simdurationMult]", that.element).val())
			  })
		  })
		  this.element.show();
		  $(document).bind("onSimulationStop", function() {
			  $("#nav-simulate a.pushed", this.element).removeClass("pushed");
		  });
		  if (app.solver && !app.solver.solve(app.options.types.functions.collaborate))
			  $("a[data-action=sharemodel]", this.element).parent().hide();
		  if (app.solver && !app.solver.solve(app.options.types.functions.library))
			  $("a[data-action=showlibrary]", this.element).parent().hide();
		  if (app.solver && !app.solver.solve(app.options.types.functions.import))
			  $("a[data-action=importmodel]", this.element).parent().hide();
		  
		  if ($("#buybtn", this.element).length==1){
		  	if (app.solver && app.solver.solve(app.options.types.functions.trial)==true && app.solver.buybtnclick)
				  $("#buybtn").click(app.solver.buybtnclick);
		  	else if (app.solver && app.solver.solve(app.options.types.functions.trial)==false)
		  		$("#buybtn").remove();
		  }
		  
		  
	  },
	  simaction : function(action) {
		  $("#nav-simulate .pushed", this.element).removeClass("pushed");
		  $("#nav-simulate a[data-action=" + action + "][data-canpushed]", this.element).addClass("pushed");
	  },
	  closeSub : function() {
		  $(".submenu:visible", this.element).slideToggle("fast");
	  },
	  addTab : function(content, options) {
		  var section = $(content).uniqueId(), li = $("<li data-class='" + $(content).attr("data-class") + "' data-original='" + $(content).attr("data-original") + "' data-tabname='" + $(content).attr("data-tabname") + "'><a data-text='" + $(content).attr("data-tabname") + "' href='#" + section.attr("id") + "'></a></li>");
		  var current = $("#controlpanel li[data-tabname='" + $(content).attr("data-tabname") + "']");
		  if (current.length > 0) {
			  if (current.attr("data-class") == $(content).attr("data-class") && current.attr("data-original") == $(content).attr("data-original")) {// existed
				  this.element.tabs("option", "active", $("#controlpanel>ul>li").index(current));
				  return $(content)
			  } else {
				  $(".cp-icon-close", current).click();
			  }
		  }
		  li.append("<span class='ui-icon cp-icon-close' role='presentation' data-title='Close'></span>");
		  app.helper.updateContent(li);
		  li.appendTo("#controlpanel>ul");
		  $("#controlpanel").append(content);
		  this.element.tabs("refresh").tabs("option", "active", -1);
		  return $(content)[$(content).attr("data-class")](options);
	  },
	  showPanel : function(index) {
		  $("#control", this.element).accordion("option", "active", index);
	  },
	  reTranslate : function() {
		  app.helper.updateContent(this.element);
		  $(":ui-accordion", this.element).accordion("refresh");
	  },
	  updateProgress : function(progress, time) {
		  if (parseInt(progress) == 1) {
			  $("#progress").removeAttr("value");
			  $("#simtime").text("")
		  } else {
			  $("#progress").attr("value", progress);
			  $("#simtime").text(Globalize.format(time, "t"));
		  }
	  },
	  updateModelChanged : function(state) {
		  if (state)
			  $("a[data-action=savemodel]", this.element).addClass("unsaved");
		  else
			  $("a[data-action=savemodel]", this.element).removeClass("unsaved");
	  },
	  _disable : function() {
		  if (this.options.disabled)
			  $("a", this.element).addClass("bpc-disabled")
		  else
			  $("a", this.element).removeClass("bpc-disabled")
	  },
	  _setOption : function(key, value) {
		  this._super(key, value);
		  if (key == "disabled")
			  this._disable();
		  if (key == "snapToGrid")
			  $(":ui-draggable", this.element).draggable("option", "grid", (app.options.settings.UI.snapToGrid) ? [app.options.settings.UI.gridSize, app.options.settings.UI.gridSize] : false)
	  },
	  _destroy : function() {
		  $("a", this.element).unbind();
		  $("#control", this.element).accordion("destroy");
		  $("a.ui-draggable", this.element).draggable("destroy");
		  $(document).unbind("onSimulationStop");
		  this.element.draggable("destroy");
	  }
	});
});