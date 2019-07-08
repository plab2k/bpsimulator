;
window.api = (function() {
	var currenthistory = 0;
	return {
		model : {
		  create : function() {
			  app.core.newModel();
			  app.model.info.created = (new Date()).toUTCString();
			  return app.model
		  },
		  open : function(data) {
			  var model;
			  this.create();
			  if (typeof data === 'string') {
				  if (data.indexOf("{\"") == 0) {// JSON
					  try {
						  model = $.parseJSON(data);
					  } catch (err) {
						  app.snackbar.show("Unsupported file format", "Contact Support", app.options.types.messageType.critical, app.helper.contactsupport);
						  app.events.error("name: Unsupported JSON format\nmessage: " + err.message, true);
					  }
				  } else if (data.indexOf("<?xml") == 0 && app.import && app.import.bpmn) {// XML
				  	try {
				  		 var xml = $.parseXML(data.replace(/semantic:/g, ''));
				  		 app.import.bpmn.load(xml, api.model.create());
					  } catch (err) {
						  app.snackbar.show("Unsupported file format", "Contact Support", app.options.types.messageType.critical, app.helper.contactsupport);
						  app.events.error("name: Unsupported XML format\nmessage: " + err.message, true);
					  }
				  }
			  } else if (data.error) {
				  app.snackbar.show(data.error, null, app.options.types.messageType.critical, null);
			  }
			  if (model) {
				  app.core.load(model);
				  app.control.update();
				  return app.model
			  } else
				  return null
				  /*
					 * if ($.isPlainObject(obj) === true)// load JSON or by ID { app.core.load(obj); app.control.update(); return app.model } else app.storage.load({ modelId : obj }, function(data) { app.core.load(data); app.control.update(); return app.model; })
					 */
		  },
		  save : function(callback) {
			  var thumbr;
			  function sv(thumbr, callback) {
				  var id, prop, model = $.extend(true,{}, app.model);
				  for (id in model.objects) {
					  for (prop in model.objects[id]) {
						  if (prop.charAt(0) == "_")
							  delete model.objects[id][prop];
					  }
				  };
				  app.model.info.coreVersion = app.options.coreVersion;
				  app.model.info.lastSaved = (new Date()).toUTCString();
				  app.model.info.revision++;
				  app.storage[app.options.settings.General.storage].save({
				    modelId : app.model.info.id,
				    content : app.core.serialize(model),
				    name : app.model.info.name,
				    extention : 'json',
				    type : 'application/json',
				    thumbr : thumbr,
				    fileId : app.options.settings.session.currentFile && app.options.settings.session.currentFile.file ? app.options.settings.session.currentFile.file : null
				  }, function(result) {
					  if (callback)
						  callback(result);
				  });
			  };
			  if (window.navigator.msSaveBlob) {
				  thumbr = "";
				  sv(thumbr, callback);
			  } else {
				  app.helper.svg2png(function(pic) {
					  thumbr = pic ? pic.replace(/\+/g, '-').replace(/\//g, '_') : "";
					  sv(thumbr, callback);
				  });
			  };
			  return app.model
		  },
		  remove : function(id) {
			  app.storage.removeItem(id);
			  return app.storage.index;
		  },
		  copy : function() {
			  app.model.info.id = app.helper.generateId();
			  app.model.info.created = (new Date()).toUTCString();
			  app.model.info.revision = 0;
			  return app.model;
		  },
		  setSnapshot : function(isnew) {
			  if (isnew === true)
				  app.options.settings.session.historyArray = [];
			  if (app.options.settings.session.historyArray.length < app.options.historylength)
				  app.options.settings.session.historyArray.push(app.options.settings.session.historyArray.length)
			  else
				  app.options.settings.session.historyArray.push(app.options.settings.session.historyArray.shift());
			  app.storage.local.saveSession("snapshot" + (app.options.settings.session.historyArray[app.options.settings.session.historyArray.length - 1]), app.core.serialize(app.model), function() {
				  currenthistory = 1;
			  });
			  return app.options.settings.session.historyArray
		  },
		  getSnapshot : function(forward) {
			  var dif = forward === true ? 1 : -1, pos = app.options.settings.session.historyArray.length - currenthistory + dif;
			  console.log(app.options.settings.session.historyArray, currenthistory);
			  if (pos >= 0 && pos < app.options.settings.session.historyArray.length) {
				  app.storage.local.loadSession("snapshot" + app.options.settings.session.historyArray[pos], function(data) {
					  $("main").modeler("clear");
					  api.model.open(data);
				  });
				  currenthistory = (forward === true) ? currenthistory - 1 : currenthistory + 1;
			  } else {
				  app.snackbar.show("No data loaded", null, app.options.types.messageType.info, null);
			  }
			  return null;
		  },
		  share : function() {
			  app.storage.share(app.model.info.id);
		  },
		  items : {
		    add : function(objClass, prop) {
			    var obj = app.core.createObject(objClass);
			    (prop) ? $.extend(true, obj, prop) : null;
			    app.control.addElement(obj, app.options.types.nameType.create);
			    return obj
		    },
		    copy : function(source, prop) {
			    var obj = app.core.createObject(source.objClass);
			    $.extend(true, obj, source, {
				    id : obj.id
			    }, prop || {});
			    for ( var field in app.options.types.objResFields.concat(["prior", "next"])) {
				    if (obj[app.options.types.objResFields.concat(["prior", "next"])[field]] !== undefined)
					    obj[app.options.types.objResFields.concat(["prior", "next"])[field]].objects = []
			    }
			    app.control.addElement(obj, app.options.types.nameType.copy);
			    return obj
		    },
		    clone : function(source) {
			    if (app.model.objects[source.id])
				    return false;
			    var obj = app.core.createObject(source.objClass), oldid = obj.id;
			    app.model.objects[source.id] = app.model.objects[obj.id];
			    $.extend(true, obj, source);
			    delete app.model.objects[oldid];
			    app.control.addElement(obj, app.options.types.nameType.clone);
			    return obj;
		    },
		    import : function(objClass, prop) {
			    var obj = app.core.createObject(objClass), oldid = obj.id;
			    app.model.objects[prop.id] = app.model.objects[obj.id];
			    $.extend(true, obj, prop);
			    delete app.model.objects[oldid];
			    app.control.addElement(obj, app.options.types.nameType.clone);
			    return obj
		    },
		    remove : function(id) {
			    app.core.deleteObject(id);
			    app.helper.tree.rescan();
		    }
		  }
		}
	}
}());