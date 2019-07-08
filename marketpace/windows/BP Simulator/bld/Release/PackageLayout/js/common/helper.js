;
window.app = window.app || {};
app.helper = (function() {
	var cbmanager = {
	  _list : [],
	  clear : function() {
		  this._list = [];
		  return this;
	  },
	  copy : function(arr) {
		  this._list = this._list.concat(arr);
		  return this;
	  },
	  clone : function(position) {
		  var i, obj, clone, center, cloned = [], fieldlist = app.options.types.objResFields.concat(["prior", "next"]), that = this;
		  if (this._list.length == 0)
			  return;
		  center = {
		    leftMin : app.model.objects[this._list[0]].position.left,
		    leftMax : app.model.objects[this._list[0]].position.left,
		    topMin : app.model.objects[this._list[0]].position.top,
		    topMax : app.model.objects[this._list[0]].position.top
		  };
		  // calc the center
		  for (i = 0; i < this._list.length; i++) {
			  obj = app.model.objects[this._list[i]];
			  center.leftMin = Math.min(center.leftMin, obj.position.left);
			  center.leftMax = Math.max(center.leftMax, obj.position.left);
			  center.topMin = Math.min(center.topMin, obj.position.top);
			  center.topMax = Math.max(center.topMax, obj.position.top);
		  };
		  center.left = (center.leftMax - center.leftMin) / 2 + center.leftMin;
		  center.top = (center.topMax - center.topMin) / 2 + center.topMin;
		  for (i = 0; i < this._list.length; i++) {
			  obj = app.model.objects[this._list[i]];
			  $("#" + obj.id)[0].removeClass("selected");
			  clone = api.model.items.copy(obj, {
				  position : {
				    top : position.top - center.top + obj.position.top,
				    left : position.left - center.left + obj.position.left
				  }
			  });
			  $("#" + clone.id)[0].addClass("selected");
			  cloned.push(clone.id);
		  };
		  for (i = 0; i < this._list.length; i++) {
			  obj = app.model.objects[this._list[i]];
			  for ( var field in fieldlist) {
				  if (obj[fieldlist[field]] !== undefined) {
					  $.each(obj[fieldlist[field]].objects, function() {
						  if ($.inArray(this.obj, that._list) > -1) {
							  app.model.objects[cloned[i]][fieldlist[field]].objects.push($.extend({}, this, {
								  obj : cloned[$.inArray(this.obj, that._list)]
							  }));
						  }
					  });
				  }
			  }
		  }
		  api.model.setSnapshot();
		  app.snackbar.show("Object created", "Undo", app.options.types.messageType.info, api.model.getSnapshot);
		  app.events.add("userAction", "copyObject", this._list.length);
		  return this;
	  }
	}
	return {
	  clipboard : cbmanager,
	  generateId : function() {
		  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxx'.replace(/[xy]/g, function(c) {
			  var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
			  return v.toString(16);
		  })
	  },
	  trans : function(msg) {
		  var loc;
		  if (app.options.settings.UI.language === app.options.types.lang.en.culture)
			  return msg;
		  loc = Globalize.localize(msg, app.options.settings.UI.language);
		  if (loc === undefined) {
			  app.events.error("Phrase is not translated: ".concat(" (", app.options.settings.UI.language, ") ", msg), false);
			  loc = msg;
		  }
		  return loc
	  },
	  loadContent : function(selector) {
		  var $content = $($(selector).html());
		  $content = this.updateContent($content);
		  return $content
	  },
	  updateContent : function(content) {
		  var that = this;
		  $("[data-text]", content).each(function() {
			  $(this).text(that.trans($(this).attr("data-text")))
		  });
		  $("[data-title]", content).each(function() {
			  $(this).attr("title", that.trans($(this).attr("data-title")))
		  });
		  return content
	  },
	  linkLabels : function(fieldset) {
		  $("label+:input,label+span :input", fieldset).filter(":input").uniqueId().each(function() {
			  $(this).prev().is("label") ? $(this).prev().attr("for", $(this).attr("id")) : $(this).parent().prev().attr("for", $(this).attr("id"));
		  });
		  return fieldset
	  },
	  updateFields : function(html, obj) {
		  $('input, select', html).each(function() {
			  if (obj[$(this).attr('name')] !== undefined)
				  if ($(this).attr('type') == 'checkbox') {
					  if (obj[$(this).attr('name')] == true)
						  $(this).prop('checked', true);
				  } else
					  $(this).val(obj[$(this).attr('name')]);
		  });
	  },
	  updateObject : function(html, obj) {
		  $('input, select', html).each(function() {
			  if (obj[$(this).attr('name')] !== undefined)
				  if (typeof (obj[$(this).attr('name')]) == 'boolean')
					  obj[$(this).attr('name')] = $(this).prop('checked');
				  else if (typeof (obj[$(this).attr('name')]) == 'string')
					  obj[$(this).attr('name')] = $(this).val();
				  else if (typeof (obj[$(this).attr('name')]) == 'number')
					  if (isNaN(parseFloat($(this).val())) == false && parseFloat($(this).val()) % 1 !== 0)
						  obj[$(this).attr('name')] = parseFloat($(this).val());
					  else if (isNaN(parseInt($(this).val())) == false)
						  obj[$(this).attr('name')] = parseInt($(this).val());
		  });
	  },
	  showMessage : function(options) {
		  $dlg = $("<div title='" + this.trans(options.title) + "'>" + this.trans(options.message) + "</div>").bpsModal({
		    resizable : false,
		    width : 300,
		    closeText : this.trans('Close'),
		    dialogClass : "bps-confirm",
		    modal : true,
		    buttons : [{
		      text : this.trans("Cancel"),
		      /*
					 * icons : { primary : "ui-icon-closethick-black" },
					 */
		      click : function() {
			      $dlg.bpsModal("destroy");
			      options.onCancel ? options.onCancel() : false;
		      }
		    }, {
		      text : this.trans(options.OKtext ? options.OKtext : "OK"),
		      /*
					 * icons : { primary : "bp-icon-check" },
					 */
		      click : function() {
			      $dlg.bpsModal("destroy");
			      options.onOk ? options.onOk() : false;
		      }
		    }]
		  })
		  // console.log("show", title)
	  },
	  expandAll : function(element) {
		  $('figcaption', element).removeClass('ui-state-default').addClass('ui-state-active').removeClass('ui-corner-all').addClass('ui-corner-top').attr('aria-expanded', 'true').attr('aria-selected', 'true').attr('tabIndex', 0).find('span.ui-icon').removeClass('ui-icon-triangle-1-e').addClass('ui-icon-triangle-1-s').closest('figcaption').next().show();
	  },
	  tree : {
	    beginners : [],
	    rescan : function() {
		    var i, obj;
		    app.helper.tree.beginners = [];
		    for (i in app.model.objects) {
			    obj = app.model.objects[i];
			    if (obj.objType === app.options.types.objType.bpObject && obj.prior.objects.length == 0 && obj.next.objects.length > 0) {
				    app.helper.tree.beginners.push(obj.id);
			    }
		    };
		    if (app.calc)
			    app.calc.recalculate();
		    if (app.simulation) {
			    app.simulation.control.set("stop");
			    app.simulation.collector.recalc();
		    }
		    return app.helper.tree.beginners
	    }
	  },
	  setDaySeconds : function(date, seconds) {
		  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, seconds)
	  },
	  setAddSeconds : function(date, seconds) {
		  var dt = new Date(date);
		  return new Date(dt.setSeconds(date.getSeconds() + seconds));
	  },
	  checkConsistency : function() {
		  var i, ii, obj, fields = [].concat(app.options.types.objResFields, ["prior", "next"]), result = true;
		  var exists = function(arr, repair) {
			  var i, result = true;
			  for (i = arr.length - 1; i >= 0; i--) {
				  if (app.model.objects[arr[i].obj] === undefined) {
					  if (repair)
						  arr.splice(i, 1);
					  result = false;
				  }
			  }
			  return result
		  };
		  var mutuality = function(side, id, repair) {
			  var i, opp, oppside, arr = side.objects, result = true;
			  for (i = arr.length - 1; i >= 0; i--) {
				  oppside = (side.execLogic) ? "next" : "prior";
				  opp = app.model.objects[arr[i].obj];
				  if (!opp[oppside] || $.map(opp[oppside].objects, function(val) {
					  return val.obj
				  }).indexOf(id) == -1) {
					  if (repair)
						  arr.splice(i, 1);
					  result = false;
				  }
			  }
			  return result
		  };
		  for (i in app.model.objects) {
			  obj = app.model.objects[i];
			  for (ii = 0; ii < fields.length; ii++)
				  if (obj[fields[ii]])
					  result = exists(obj[fields[ii]].objects, true) && result;
			  for (ii = 0; ii < ["prior", "next"].length; ii++)
				  if (obj[["prior", "next"][ii]])
					  result = mutuality(obj[["prior", "next"][ii]], obj.id, true) && result;
		  }
		  return result
	  },
	  gtc : function(n, k) {
		  var matches = document[unescape('%63%6F%6F%6B%69%65')].match(new RegExp("(?:^|; )" + n.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"))
		  return matches ? atob(decodeURIComponent(matches[1])) : undefined
	  },
	  cloneDR : function(o) {
		  // http://stackoverflow.com/questions/728360/most-elegant-way-to-clone-a-javascript-object
		  const
		  gdcc = "__getDeepCircularCopy__";
		  if (o !== Object(o)) {
			  return o; // primitive value
		  }
		  var set = gdcc in o, cache = o[gdcc], result;
		  if (set && typeof cache == "function") {
			  return cache();
		  }
		  // else
		  o[gdcc] = function() {
			  return result;
		  }; // overwrite
		  if (o instanceof Array) {
			  result = [];
			  for (var i = 0; i < o.length; i++) {
				  result[i] = app.helper.cloneDR(o[i]);
			  }
		  } else {
			  result = {};
			  for ( var prop in o)
				  if (prop != gdcc)
					  result[prop] = app.helper.cloneDR(o[prop]);
				  else if (set)
					  result[prop] = app.helper.cloneDR(cache);
		  }
		  if (set) {
			  o[gdcc] = cache; // reset
		  } else {
			  delete o[gdcc]; // unset again
		  }
		  return result;
	  },
	  onauth : function(oauthresult) {
		  var userinfo, matches;
		  matches = document.cookie.match(new RegExp("(?:^|; )" + app.options.keyNames.userinfo.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"))
		  if (matches) {
			  userinfo = atob(decodeURIComponent(matches[1])).split(':');
			  $.extend(app.options.userinfo, {
			    id : userinfo[0],
			    name : decodeURIComponent(userinfo[1]),
			    email : userinfo[2],
			    created : new Date(userinfo[3] * 1000),
			    authorized : true
			  });
		  } else if (oauthresult) {
			  $.extend(app.options.userinfo, {
			    id : oauthresult.id,
			    name : oauthresult.name,
			    email : oauthresult.email,
			    created : new Date(oauthresult.created * 1000),
			    authorized : true
			  });
		  }
		  if (userinfo) {
			  if (typeof ga !== 'undefined')
				  ga('set', 'userId', app.options.userinfo.id);
			  if (typeof mixpanel !== 'undefined') {
				  mixpanel.identify(app.options.userinfo.id);
				  mixpanel.people.set({
				    "$email" : app.options.userinfo.email,
				    "$name" : app.options.userinfo.name,
				    "$created" : app.options.userinfo.created,
				    "$last_login" : new Date(),
				    "Version" : app.options.appVersion
				  });
			  };
			  if (typeof jivo_api !== 'undefined') {
				  jivo_api.setContactInfo({
				    name : app.options.userinfo.name,
				    email : app.options.userinfo.email
				  });
			  }
		  }
		  matches = document.cookie.match(new RegExp("(?:^|; )" + app.options.keyNames.license.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"))
		  if (matches)
			  app.options[app.options.keyNames.license] = decodeURIComponent(matches[1]);
	  },
	  getParameterByName : function(name) {
		  var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
		  return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
	  },
	  contactsupport : function() {
		  if (typeof jivo_api !== 'undefined')
			  jivo_api.open();
		  else
			  window.open("mailto:support@bpsimulator.com", "_blank");
	  },
	  exportimg : function() {
		  var txthgh = 30;
		  var copy = document.getElementById("area").cloneNode(true);
		  var text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
		  var bb = $("#bpm-figures")[0].getBBox();
		  copy.setAttribute("width", bb.width + 1);
		  copy.setAttribute("height", bb.height + txthgh + 1);
		  copy.setAttribute("style", "background:white;");
		  copy.removeChild(copy.getElementById("bpmGrid"));
		  text.textContent = 'bpsimulator.com';
		  text.setAttribute("text-anchor", "end");
		  text.setAttribute("x", bb.width + bb.x);
		  text.setAttribute("y", bb.y + bb.height + 20);
		  text.setAttribute("font-size", 12);
		  copy.getElementById("bpm-figures").appendChild(text);
		  copy.getElementById("bpm-figures").setAttribute("transform", "translate(-" + Math.max(0, bb.x - 1) + ".5,-" + Math.max(0, bb.y - 1) + ".5)");
		  return copy
	  },
	  utf8encode : function(string) {
		  string = string.replace(/rn/g, "n");
		  var utftext = "";
		  for (var n = 0; n < string.length; n++) {
			  var c = string.charCodeAt(n);
			  if (c < 128) {
				  utftext += String.fromCharCode(c);
			  } else if ((c > 127) && (c < 2048)) {
				  utftext += String.fromCharCode((c >> 6) | 192);
				  utftext += String.fromCharCode((c & 63) | 128);
			  } else {
				  utftext += String.fromCharCode((c >> 12) | 224);
				  utftext += String.fromCharCode(((c >> 6) & 63) | 128);
				  utftext += String.fromCharCode((c & 63) | 128);
			  }
		  }
		  return utftext;
	  },
	  postImage : function(opts) {
		  var DEFAULT_CALL_OPTS = {
		    url : '',
		    type : 'POST',
		    cache : false,
		    success : null,
		    error : null,
		    processData : false,
		    xhr : function() {
			    var xhr = $.ajaxSettings.xhr();
			    xhr.send = function(string) {
				    var stringToBinaryArray = function(string) {
					    return Array.prototype.map.call(string, function(c) {
						    return c.charCodeAt(0) & 0xff;
					    });
				    };
				    var bytes = stringToBinaryArray(string);
				    XMLHttpRequest.prototype.send.call(this, new Uint8Array(bytes).buffer);
			    };
			    return xhr;
		    }
		  };
		  var callObj = $.extend({}, DEFAULT_CALL_OPTS, opts.call);
		  var boundary = 'My bpsim separator ' + Math.random();
		  var composeMultipartData = function(fields, boundary) {
			  var data = '';
			  $.each(fields, function(key, value) {
				  data += '--' + boundary + '\r\n';
				  if (value.dataString) { // file upload
					  data += 'Content-Disposition: form-data; name=\'' + key + '\'; ' + 'filename=\'' + value.name + '\'\r\n';
					  data += 'Content-Type: ' + value.type + '\r\n\r\n';
					  data += value.dataString + '\r\n';
				  } else {
					  data += 'Content-Disposition: form-data; name=\'' + key + '\';' + '\r\n\r\n';
					  data += value + '\r\n';
				  }
			  });
			  data += '--' + boundary + '--';
			  return data;
		  };
		  opts.fb.accessToken ? callObj.url += '?access_token=' + opts.fb.accessToken : null;
		  callObj.data = composeMultipartData(opts.fb, boundary);
		  callObj.contentType = 'multipart/form-data; boundary=' + boundary;
		  $.ajax(callObj);
	  },
	  svg2png : function(callback) {
		  if (typeof svgAsDataUri != 'undefined')
			  svgAsDataUri(app.helper.exportimg(), {}, function(uri) {
				  var image = new Image();
				  image.onerror = function(err) {
					  callback(null);
				  }
				  image.onload = function() {
					  var canvas = document.createElement('canvas');
					  canvas.width = image.width;
					  canvas.height = image.height;
					  var context = canvas.getContext('2d');
					  context.drawImage(image, 0, 0);
					  var data = canvas.toDataURL('image/png');
					  callback(data.replace(/^data:image\/(png|jpe?g);base64,/, ''));
				  }
				  image.src = uri;
			  });
		  else
			  callback(null);
	  },
	  lastOpenedmodel : function(fileId) {
		  app.options.settings.session.lastsavedmodel = {
		    storage : app.options.settings.General.storage,
		    file : fileId
		  };
		  app.options.settings.session.currentFile = {
		    storage : app.options.settings.General.storage,
		    file : fileId.indexOf(".json") > 0 ? fileId : null
		  };
		  app.options.save();
	  }
	}
}());