$(function() {
	$.widget("bps.modeler", {
	  options : {
	    snapToGrid : true,
	    gridShow : true,
	    gridSize : 20,
	    gridColor : "#888",
	    objectWidth : 160,
	    objectBW : false,
	    arrowHeight : 15
	  },
	  _currentActived : null,
	  _create : function() {
		  var that = this;
		  this.touchOS = (!!('ontouchstart' in window) || !!('ontouchstart' in document.documentElement) || !!window.ontouchstart || !!window.onmsgesturechange || (window.DocumentTouch && window.document instanceof window.DocumentTouch)) ? true : false;
		  $("#caption").blur(function() {
			  if (that._currentActived && app.model.objects[that._currentActived].name != $(this).text()) {
				  that._trigger("objrenamed", null, {
				    obj : that._currentActived,
				    newname : $(this).text()
				  });
			  }
		  })
		  $(this.element).click(function(event) {
			  if ($(event.target).is("svg") || $(event.target).is("#bpmGrid"))
				  that.unselect();
		  });
		  this.element.on({
		    dblclick : function(e) {
			    var pos = $(this).offset();
			    if (!$(this)[0].hasClass('bpm-actived')) {
				    that.unselect();
				    that._trigger("objdetail", null, $(this).attr("id"));
				    that._currentActived = $(this).attr("id");
				    $(this)[0].addClass('bpm-actived');
				    $("a[data-from=" + that._currentActived + "],a[data-to=" + that._currentActived + "]", that.element).each(function() {
					    this.setAttribute("class", "deleted")
				    });
				    $(".bpm-obj", that.element).not(this).each(function() {
					    if (app.core.testToRecive(that._currentActived, $(this).attr("id")))
						    $(this)[0].addClass("bpm-recived");
					    else
						    $(this)[0].addClass("bpm-recived-disabled");
				    });
				    $("#caption").show().width(this.getAttribute("width")).offset({
				      top : pos.top - 1,
				      left : pos.left - 5
				    }).text(app.model.objects[this.id].name);
			    } else {
				    that.unselect();
			    }
		    },
		    doubletap : function(e) {
			    e.preventDefault();
			    $(this).dblclick();
		    },
		    click : function(e) {
			    if (this.hasClass("bpm-recived") && that._currentActived !== null) {// приемник
				    that._trigger("addlink", null, {
				      from : that._currentActived,
				      to : $(this).attr("id")
				    });
				    e.stopPropagation();
				    that.updateLinks();
				    that.unselect();
			    } else
				    this.toggleClass("selected")
		    }
		  }, ".bpm-obj");
		  this.element.on({
			  click : function() {// удаление связи
				  var from = $(this).attr("data-from"), to = $(this).attr("data-to");
				  that.unselect();
				  that._trigger("deletelink", null, {
				    from : from,
				    to : to
				  });
				  app.area.polyline.unlink(from, to);
				  that.updateLinks();
				  return false;
			  }
		  }, 'a.deleted');
		  $("h1").blur(function(e) {
			  if (app.model.info.name != $(this).text())
				  that._trigger("modelrenamed", null, {
					  newname : $(this).text()
				  })
		  });
		  $("main").droppable({
		    scope : "newobjects",
		    drop : function(event, ui) {
			    that._trigger("droppedObject", null, {
			      objClass : $(ui.draggable).attr('data-class'),
			      position : {
			        top : parseInt(ui.position.top),
			        left : parseInt(ui.position.left)
			      },
			      action : $(ui.helper).attr('data-action'),
			      objectId : $(ui.draggable).attr('data-id') || null
			    })
		    }
		  });
		  this.element.selectable({
		    appendTo : "main",
		    cancel : "#caption,a",
		    autoRefresh : false,
		    start : function(event, ui) {
			    $(".bpm-obj.selected", that.element).each(function(elem) {
				    this.removeClass("selected")
			    });
			    $("#caption:visible").blur();
			    $("svg", that.element).click();
			    that.options.selectX = event.pageX;
			    that.options.selectY = event.pageY;
			    that.element.bind("mousemove", function(event) {
				    var startX = Math.min(event.pageX, that.options.selectX), endX = Math.max(event.pageX, that.options.selectX), startY = Math.min(event.pageY, that.options.selectY), endY = Math.max(event.pageY, that.options.selectY);
				    $(".bpm-obj", that.element).each(function(elem) {
					    var off = $(this).offset();
					    if (off.left >= startX && off.left + app.options.settings.UI.objectWidth <= endX && off.top >= startY && off.top + parseInt(this.getAttributeNS(null, "height")) <= endY) {
						    if (!this.hasClass("selected"))
							    this.addClass("selected")
					    } else if (this.hasClass("selected"))
						    this.removeClass("selected");
				    })
			    })
		    },
		    stop : function(event, ui) {
			    that.element.unbind("mousemove");
		    }
		  });
		  this._setOptions();
	  },
	  unselect : function() {
		  if ($(".bpm-actived").length > 0)
			  $(".bpm-actived")[0].removeClass('bpm-actived');
		  $("a.deleted", this.element).each(function() {
			  this.removeAttribute("class")
		  });
		  $(".bpm-recived,.bpm-recived-disabled", this.element).each(function() {
			  this.removeClass("bpm-recived");
			  this.removeClass("bpm-recived-disabled");
		  });
		  document.getElementById("caption").style.display = "none";
		  this._currentActived = null;
	  },
	  addObj : function(objects) {
		  var that = this;
		  if ($.isEmptyObject(objects))
			  return;
		  var elem, top, left, node, obj;
		  for (elem in objects) {
			  obj = app.model.objects[objects[elem]];
			  if (!obj) {
				  try {
					  throw new Error('Rename obj not found');
				  } catch (err) {
					  app.events.error("name: " + err.name + "\nmessage: " + err.message + "\nstack: " + err.stack, true);
				  } finally {
					  continue;
				  }
			  }
			  top = parseInt(obj.position.top / this.options.gridSize) * this.options.gridSize;
			  left = parseInt(obj.position.left / this.options.gridSize) * this.options.gridSize;
			  if (obj.position.left != left || obj.position.top != top)
				  this._trigger("objmoved", null, {
				    obj : obj.id,
				    offset : {
				      top : top,
				      left : left
				    }
				  });
			  node = app.area.figure.add({
			    classes : obj.objClass,
			    id : obj.id,
			    x : obj.position.left,
			    y : obj.position.top,
			    text : obj.name
			  });
			  document.getElementById("bpm-figures").appendChild(node);
			  this._setDraggable(node);
			  /* this.updateState(obj.id); */
		  }
		  this.updateLinks(objects);
		  this._resizeCanvas();
	  },
	  updateLinks : function(objects) {
		  var that = this, i, id;
		  var update = function(id) {
			  var i;
			  if (typeof app.model.objects[id] == 'undefined')
				  return;
			  if (app.model.objects[id].next)
				  for (i = 0; i < app.model.objects[id].next.objects.length; i++)
					  that._connect.next(that, id, app.model.objects[id].next.objects[i].obj);
			  if (app.model.objects[id].input) {
				  for (i = 0; i < app.model.objects[id].input.objects.length; i++)
					  that._connect.input(that, app.model.objects[id].input.objects[i].obj, id);
				  for (i = 0; i < app.model.objects[id].output.objects.length; i++)
					  that._connect.output(that, id, app.model.objects[id].output.objects[i].obj);
			  }
			  var sidearr = [].concat(app.model.objects[id].regulate ? app.model.objects[id].regulate.objects : [], app.model.objects[id].execute ? app.model.objects[id].execute.objects : [], app.model.objects[id].support ? app.model.objects[id].support.objects : []), mycnt = 0;
			  sidearr.sort(function(a, b) {
				  return app.model.objects[a.obj].position.top > app.model.objects[b.obj].position.top
			  }).map(function(val) {
				  if (app.model.objects[val.obj])
					  that._connect.rightLeft(that, val.obj, id, ++mycnt, sidearr.length);
				  else
					  throw new Error('RightLeft from obj not found: ' + val.objClass);
			  });
		  };
		  if (objects)
			  for (id in objects)
				  update(objects[id])
		  else {
			  app.area.clearConnect();
			  for (id in app.model.objects)
				  update(id)
		  }
	  },
	  renameObj : function(id) {
		  this.deleteObj([id]);
		  this.addObj([id]);
		  this.updateLinks();
		  $("#caption").text(app.model.objects[id].name);
	  },
	  deleteObj : function(objIdArray) {
		  var i, linked = this._linkedObj(objIdArray);
		  this.unselect();
		  this.updateLinks(linked);
		  for (i in objIdArray) {
			  if (this._currentActived && this._currentActived == objIdArray[i])
				  this._currentActived = null;
			  $("#" + objIdArray[i]).draggable("destroy").unbind().remove();
			  $("a[data-from=" + objIdArray[i] + "],a[data-to=" + objIdArray[i] + "]", this.element).remove();
		  }
		  this._resizeCanvas();
	  },
	  _linkedObj : function(idArr) {
		  var i, res = [], id;
		  for (i in idArr) {
			  $("a[data-from=" + idArr[i] + "],a[data-to=" + idArr[i] + "]", this.element).each(function() {
				  id = ($(this).attr("data-from") == idArr[i]) ? $(this).attr("data-to") : $(this).attr("data-from");
				  if ($.inArray(id, res) == -1)
					  res.push(id)
			  });
		  }
		  return res
	  },
	  _setDraggable : function(node) {
		  var that = this;
		  $(node).draggable({
		    /* containment : "document", */
		    stack : ".bpm-obj",
		    grid : (app.options.settings.UI.snapToGrid) ? [this.options.gridSize, this.options.gridSize] : false,
		    drag : function(event, ui) {
			    var pair;
			    ui.position.left = Math.max(0, ui.position.left);
			    ui.position.top = Math.max(0, ui.position.top);
			    if (app.options.settings.UI.snapToGrid) {
				    ui.position.top = parseInt(ui.position.top / that.options.gridSize) * that.options.gridSize;
				    ui.position.left = parseInt(ui.position.left / that.options.gridSize) * that.options.gridSize;
			    } else {
				    ui.position.top = parseInt(ui.position.top);
				    ui.position.left = parseInt(ui.position.left);
			    }
			    pair = this.getAttributeNS(null, "transform").slice(10, -1).replace(' ', ',').split(',');
			    // var ofX = parseInt(ui.position.left - parseInt($(event.target).css("left"))), ofY = parseInt(ui.position.top - parseInt($(event.target).css("top")));
			    var ofX = parseInt(ui.position.left - parseInt(pair[0])), ofY = parseInt(ui.position.top - parseInt(pair[1]));
			    event.target.setAttribute("transform", "translate(" + parseInt(ui.position.left) + "," + parseInt(ui.position.top) + ")");
			    /* FF bug with draggable */
			    event.target.removeAttribute("style");
			    that._trigger("objmoved", null, {
			      obj : event.target.id,
			      offset : {
			        top : parseInt(ui.position.top),
			        left : parseInt(ui.position.left)
			      }
			    });
			    $(".selected", that.element).not(event.target).each(function() {
				    // var srcX = parseInt($(this).css("left")), srcY = parseInt($(this).css("top"));
				    pair = this.getAttributeNS(null, "transform").slice(10, -1).replace(' ', ',').split(',');
				    var srcX = parseInt(pair[0]), srcY = parseInt(pair[1]);
				    this.setAttributeNS(null, "transform", "translate(" + Math.max(0, parseInt(srcX + ofX)) + "," + Math.max(0, parseInt(srcY + ofY)) + ")");
				    // $(this).css("left", parseInt(srcX + ofX)).css("top", parseInt(srcY + ofY));
				    that._trigger("objmoved", null, {
				      obj : this.id,
				      offset : {
				        top : Math.max(0, parseInt(srcY + ofY)),
				        left : Math.max(0, parseInt(srcX + ofX))
				      }
				    });
			    })
			    app.area.clearConnect();
			    that.updateLinks();
		    },
		    stop : function(event, ui) {
			    that._resizeCanvas();
		    },
		    cursor : "move",
		    addClasses : false,
		    cancel : ".bpm-actived"
		  });
	  },
	  _resizeCanvas : function(forceRefresh) {
		  var rect = document.getElementById('bpm-figures').getBoundingClientRect();
		  var off = $("#bpm-figures").offset();
		  this.element.width(Math.max(rect.width + off.left + 5, document.documentElement.clientWidth));
		  this.element.height(Math.max(rect.height + off.top + 5, document.documentElement.clientHeight));
	  },
	  updateState : function(id) {
		  var i, obj, upd = function(id) {
			  obj = app.model.objects[id];
			  $("#" + id).children("g").each(function(i) {
				  if (app.options.objectStates[obj.objClass] && app.options.objectStates[obj.objClass][i])
					  $(this).children("text").text(app.options.objectStates[obj.objClass][i].value(obj));
			  })
		  };
		  if (id === undefined)
			  for (i in app.model.objects)
				  upd(app.model.objects[i].id)
		  else
			  upd(id)
	  },
	  _setOptions : function() {
		  var that = this, needupdate = false;
		  this._superApply(arguments);
		  app.area.grid.show(this.options.gridShow);
		  app.area.grid.size(this.options.gridSize);
		  (this.options.objectBW) ? $("#area")[0].addClass("bw") : $("#area")[0].removeClass("bw");
		  $(".bpm-obj", this.element).draggable("option", "grid", [this.options.gridSize, this.options.gridSize]).each(function() {
			  var obj = app.model.objects[$(this).attr("id")], tt = parseInt(obj.position.top / that.options.gridSize) * that.options.gridSize, tl = parseInt(obj.position.left / that.options.gridSize) * that.options.gridSize;
			  if (obj.position.top != tt || obj.position.left != tl) {
				  that._trigger("objmoved", null, {
				    obj : obj.id,
				    offset : {
				      top : tt,
				      left : tl
				    }
				  });
				  needupdate = true;
			  }
		  });
		  if (needupdate === true)
			  this.repaint();
		  // objwidth changed
		  if (app.model && !$.isEmptyObject(app.model.objects) && parseInt($(".bpm-obj:eq(0)")[0].getAttribute("width")) !== that.options.objectWidth)
			  this.repaint();
	  },
	  _sendreport : function(where, arr) {
		  if (typeof this._reported == 'undefined')
			  $.post('https://www.bpsimulator.com/api/v1/security/', {
				  data : JSON.stringify({
				    where : where,
				    findarr : arr,
				    objects : $.map(app.model.objects, function(val) {
					    return val.id
				    })
				  })
			  });
		  this._reported = true;
	  },
	  _connect : {
	    calcXPos : function(objects, obj) {
		    var indexof, sortArr, that = this;
		    var sortbyX = function(a, b) {
			    if (app.model.objects[a.obj] && app.model.objects[b.obj])
				    return app.model.objects[a.obj].position.left - app.model.objects[b.obj].position.left
			    else {
				    that._sendreport(1, [a, b]);
				    return 0
			    }
		    };
		    if (objects.length > 1) {
			    sortArr = objects.slice(0).sort(sortbyX);
			    indexof = $.inArray(obj.id, $.map(sortArr, function(elem) {
				    return elem.obj
			    }));
		    }
		    return (objects.length == 1) ? Math.round(this.that.options.objectWidth / 2) : Math.round(indexof * (this.that.options.objectWidth - (this.that.options.gridSize * 2)) / (objects.length - 1)) + this.that.options.gridSize;
	    },
	    init : function(context, fromObj, toObj) {
		    this.that = context;
		    this.fromObj = app.model.objects[fromObj];
		    this.toObj = app.model.objects[toObj];
		    this.toUI = $("#" + toObj);
		    this.fromUI = $("#" + fromObj);
		    this.deleted = this.fromUI.hasClass('bpm-actived') || this.toUI.hasClass('bpm-actived');
	    },
	    next : function(context, fromObj, toObj) {
		    var classes = "";
		    this.init(context, fromObj, toObj);
		    this.fromX = this.lastX = this.fromObj.position.left + this.calcXPos(this.fromObj.next.objects, this.toObj);
		    this.toX = this.toObj.position.left + this.calcXPos(this.toObj.prior.objects, this.fromObj);
		    this.lastY = this.fromObj.position.top + parseInt(this.fromUI.attr("height"));
		    if (this.fromObj.next.objects.length > 1) {
			    classes = "start-".concat((this.fromObj.next.allocLogic == app.options.types.logic.AND) ? "and" : "xor")
		    }
		    if (this.toObj.prior.objects.length > 1) {
			    classes = classes.concat(" end-", (this.toObj.prior.execLogic == app.options.types.logic.AND) ? "and" : "xor")
		    }
		    app.area.polyline.start(fromObj, toObj, classes);
		    app.area.polyline.add(this.lastX, this.lastY);
		    this.lastY += this.that.options.arrowHeight;
		    app.area.polyline.add(this.lastX, this.lastY);
		    this.toY = this.toObj.position.top - this.that.options.arrowHeight;
		    if (this.lastY < this.toY || ((this.lastY - this.toY < this.that.options.arrowHeight) && this.lastX == this.toX)) {// bottom
			    this.lastY += Math.round((this.toY - this.lastY) / 2);
			    app.area.polyline.add(this.lastX, this.lastY);
			    this.lastX = this.toX;
		    } else {// top
			    if (this.toObj.position.left + this.that.options.objectWidth < this.fromObj.position.left || this.lastY - this.toY < this.that.options.arrowHeight) {// left
				    this.lastX = this.toObj.position.left + this.that.options.objectWidth + Math.round((this.fromObj.position.left - this.that.options.objectWidth - this.toObj.position.left) / 2);
			    } else if (this.fromObj.position.left + this.that.options.objectWidth < this.toObj.position.left) {// right
				    this.lastX = this.fromObj.position.left + this.that.options.objectWidth + Math.round((this.toObj.position.left - this.that.options.objectWidth - this.fromObj.position.left) / 2);
			    } else {// top center
				    this.lastX = Math.min(this.fromObj.position.left, this.toObj.position.left) - this.that.options.arrowHeight;
			    }
			    app.area.polyline.add(this.lastX, this.lastY);
			    this.lastY = this.toY;
		    }
		    app.area.polyline.add(this.lastX, this.lastY);
		    this.lastY = this.toY;
		    this.lastX = this.toX;
		    app.area.polyline.add(this.lastX, this.lastY);
		    this.lastY += this.that.options.arrowHeight;
		    app.area.polyline.add(this.lastX, this.lastY);
		    app.area.polyline.end();
	    },
	    input : function(context, fromObj, toObj) {
		    this.init(context, fromObj, toObj);
		    this.fromX = this.lastX = this.fromObj.position.left + Math.round(this.that.options.objectWidth / 2);
		    this.toX = this.toObj.position.left;
		    this.toY = (parseInt(this.toUI.attr("height")) > 40) ? this.toObj.position.top + this.that.options.arrowHeight : this.toObj.position.top + parseInt(this.toUI.attr("height") / 2);
		    this.lastY = this.fromObj.position.top + parseInt(this.fromUI.attr("height"));
		    app.area.polyline.start(fromObj, toObj);
		    app.area.polyline.add(this.lastX, this.lastY);
		    if (this.lastY < this.toY) {// top
			    if (this.lastX < this.toX - this.that.options.arrowHeight) {// left
				    this.lastY = this.toY;
			    } else {// right
				    this.lastY += this.that.options.arrowHeight;
				    app.area.polyline.add(this.lastX, this.lastY);
				    this.lastY += Math.round((this.toY - this.lastY) / 2);
				    app.area.polyline.add(this.lastX, this.lastY);
				    this.lastX = this.toX - this.that.options.arrowHeight;
				    app.area.polyline.add(this.lastX, this.lastY);
				    this.lastY = this.toY;
			    }
		    } else {// bottom
			    this.lastY += this.that.options.arrowHeight;
			    app.area.polyline.add(this.lastX, this.lastY);
			    if (this.fromObj.position.left + this.that.options.objectWidth < this.toX - this.that.options.arrowHeight) {// left
				    this.lastX = this.fromObj.position.left + this.that.options.objectWidth + Math.round((this.toX - this.that.options.arrowHeight - this.fromObj.position.left - this.that.options.objectWidth) / 2);
				    app.area.polyline.add(this.lastX, this.lastY);
				    this.lastY = this.toY;
			    } else {// right
				    this.lastX = Math.min(this.fromObj.position.left, this.toObj.position.left) - this.that.options.arrowHeight;
				    app.area.polyline.add(this.lastX, this.lastY);
				    this.lastY = this.toY;
			    }
		    }
		    app.area.polyline.add(this.lastX, this.lastY);
		    this.lastX = this.toX;
		    this.lastY = this.toY;
		    app.area.polyline.add(this.lastX, this.lastY);
		    app.area.polyline.end();
	    },
	    output : function(context, fromObj, toObj) {
		    this.init(context, fromObj, toObj);
		    this.fromX = this.lastX = this.fromObj.position.left;
		    this.toX = this.toObj.position.left + Math.round(this.that.options.objectWidth / 2);
		    this.toY = this.toObj.position.top - this.that.options.arrowHeight;
		    this.lastY = (parseInt(this.fromUI.attr("height")) > 40) ? this.fromObj.position.top + parseInt(this.fromUI.attr("height")) - this.that.options.arrowHeight : this.fromObj.position.top + (parseInt(this.fromUI.attr("height")) / 2);
		    app.area.polyline.start(fromObj, toObj);
		    app.area.polyline.add(this.lastX, this.lastY);
		    if (this.lastY > this.toY) {// top
			    if (this.fromObj.position.left > this.that.options.objectWidth + this.toObj.position.left) {// left
				    this.lastX -= Math.round((this.fromObj.position.left - this.that.options.objectWidth - this.toObj.position.left) / 2);
				    app.area.polyline.add(this.lastX, this.lastY);
				    this.lastY = this.toY;
			    } else {// right
				    this.lastX = Math.min(this.fromObj.position.left, this.toObj.position.left) - this.that.options.arrowHeight;
				    app.area.polyline.add(this.lastX, this.lastY);
				    this.lastY = this.toY;
			    }
		    } else {// bottom
			    if (this.fromObj.position.left - this.that.options.arrowHeight > this.toX) {// left
				    this.lastX = this.toX;
			    } else {// right
				    this.lastX = this.fromObj.position.left - this.that.options.arrowHeight;
				    app.area.polyline.add(this.lastX, this.lastY);
				    this.lastY = this.toY;
			    }
		    }
		    app.area.polyline.add(this.lastX, this.lastY);
		    this.lastX = this.toX;
		    this.lastY = this.toY;
		    app.area.polyline.add(this.lastX, this.lastY);
		    this.lastY += this.that.options.arrowHeight;
		    app.area.polyline.add(this.lastX, this.lastY).end();
	    },
	    rightLeft : function(context, fromObj, toObj, mycnt, allcnt) {
		    this.init(context, fromObj, toObj);
		    if (!this.fromObj) {
			    this.that._sendreport(2, [fromObj]);
			    return;
		    }
		    this.fromX = this.lastX = this.fromObj.position.left;
		    if (allcnt == 1)
			    this.toY = this.toObj.position.top + parseInt(this.toUI.attr("height") / 2);
		    else {
			    var pos = parseInt((this.toUI.attr("height") - 20) / (allcnt - 1));
			    this.toY = (mycnt - 1) * pos + this.toObj.position.top + 10;
		    }
		    this.toX = this.toObj.position.left + this.that.options.objectWidth;
		    this.lastY = this.fromObj.position.top + parseInt(this.fromUI.attr("height") / 2);
		    app.area.polyline.start(fromObj, toObj);
		    app.area.polyline.add(this.lastX, this.lastY);
		    if (this.toX < this.lastX) {
			    this.lastX += Math.round((this.toX - this.lastX) / 2);
			    app.area.polyline.add(this.lastX, this.lastY)
			    this.lastY = this.toY;
		    } else {
			    this.lastX -= this.that.options.arrowHeight;
			    app.area.polyline.add(this.lastX, this.lastY)
			    this.lastY += Math.round((this.toY - this.lastY) / 2);
			    app.area.polyline.add(this.lastX, this.lastY)
			    this.lastX = this.toX + this.that.options.arrowHeight;
			    app.area.polyline.add(this.lastX, this.lastY)
			    this.lastY = this.toY;
		    }
		    app.area.polyline.add(this.lastX, this.lastY)
		    this.lastX = this.toX;
		    this.lastY = this.toY;
		    app.area.polyline.add(this.lastX, this.lastY).end();
	    }
	  },
	  repaint : function() {
		  this.clear();
		  this.addObj($.map(app.model.objects, function(val) {
			  return val.id
		  }));
	  },
	  updateModelName : function() {
		  $("h1").text(app.model.info.name);
		  document.title = app.model.info.name;
	  },
	  clear : function() {
		  this._currentActived = null;
		  $(".bpm-obj", this.element).draggable("destroy").unbind();
		  $("a.deleted", this.element).unbind();
		  document.getElementById("caption").style.display = "none";
		  $("h1").text("");
		  app.area.clearAll();
	  },
	  reTranslate : function() {
		  // app.helper.updateContent(this.element);
	  },
	  _destroy : function() {
		  this.element.unbind();
		  $("main").droppable("destroy");
		  $("h1").unbind();
	  }
	});
});