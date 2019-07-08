;
window.app = window.app || {};
app.model = {};
app.core = (function() {
	var removeObj = function(obj) {
		var i, len, field, pos;
		var recover = function(element) {
			return element.obj
		};
		if (obj.objType === app.options.types.objType.bpObject) {
			for (i = 0; i < obj.prior.objects.length; i++) {// проблемное место в IE
				var prior = app.model.objects[obj.prior.objects[i].obj];
				if (prior === undefined)
					throw new Error("Prior obj not found, Consistency: " + app.helper.checkConsistency());
				// app.model.objects[obj.prior.objects[i].obj].next.objects.splice(app.model.objects[obj.prior.objects[i].obj].next.objects.map(recover).indexOf(obj.id), 1);
				if (prior.next.objects.map(recover).indexOf(obj.id) == -1)
					throw new Error("Next obj not found, Consistency: " + app.helper.checkConsistency());
				prior.next.objects.splice(prior.next.objects.map(recover).indexOf(obj.id), 1);
			}
			for (i = 0; i < obj.next.objects.length; i++)
				app.model.objects[obj.next.objects[i].obj].prior.objects.splice(app.model.objects[obj.next.objects[i].obj].prior.objects.map(recover).indexOf(obj.id), 1);
		} else if (obj.objType === app.options.types.objType.bpSubject) {
			len = app.model.objects.length;
			for (i in app.model.objects) {
				switch (obj.objClass) {
					case app.options.types.objClass.bpRegulate :
						if (app.model.objects[i]["regulate"] && $.inArray(obj.id, app.model.objects[i]["regulate"]["objects"].map(recover)) != -1)
							app.model.objects[i]["regulate"]["objects"].splice($.inArray(obj.id, app.model.objects[i]["regulate"]["objects"].map(recover)), 1);
						break;
					case app.options.types.objClass.bpSupport :
						if (app.model.objects[i]["support"] && $.inArray(obj.id, app.model.objects[i]["support"]["objects"].map(recover)) != -1)
							app.model.objects[i]["support"]["objects"].splice($.inArray(obj.id, app.model.objects[i]["support"]["objects"].map(recover)), 1);
						break;
					case app.options.types.objClass.bpInOut :
						if (app.model.objects[i]["input"] && $.inArray(obj.id, app.model.objects[i]["input"]["objects"].map(recover)) != -1)
							app.model.objects[i]["input"]["objects"].splice($.inArray(obj.id, app.model.objects[i]["input"]["objects"].map(recover)), 1);
						if (app.model.objects[i]["output"] && $.inArray(obj.id, app.model.objects[i]["output"]["objects"].map(recover)) != -1)
							app.model.objects[i]["output"]["objects"].splice($.inArray(obj.id, app.model.objects[i]["output"]["objects"].map(recover)), 1);
						break;
					case app.options.types.objClass.bpExecute :
						if (app.model.objects[i]["execute"] && $.inArray(obj.id, app.model.objects[i]["execute"]["objects"].map(recover)) != -1)
							app.model.objects[i]["execute"]["objects"].splice($.inArray(obj.id, app.model.objects[i]["execute"]["objects"].map(recover)), 1);
						break;
					case app.options.types.objClass.bpComment :
						break;
					default :
						throw new Error("Can't to delete the object");
				}
			}
		} else
			throw new Error("Bad object type");
		delete app.model.objects[obj.id];
		for (x in obj)
			delete obj[x];
	};
	return {
	  model : null,
	  isChanged : false,
	  createObject : function(objClass, options) {
		  var obj = app.options.newObject(objClass);
		  obj.id = app.helper.generateId();
		  app.model.objects[obj.id] = obj;
		  return obj
	  },
	  deleteObject : function(id) {
		  return (app.model.objects[id]) ? removeObj(app.model.objects[id]) : null;
	  },
	  link : function(from, to, options) {
		  var from = app.model.objects[from], to = app.model.objects[to];
		  switch (from.objClass) {
			  case app.options.types.objClass.bpRegulate :
				  to.regulate.objects.push({
					  obj : from.id
				  });
				  break;
			  case app.options.types.objClass.bpSupport :
				  to.support.objects.push({
				    obj : from.id,
				    costPerTask : (options) ? options.costPerTask : false,
				    costValue : (options) ? options.costValue : 0
				  });
				  break;
			  case app.options.types.objClass.bpInOut :
				  to.input.objects.push({
					  obj : from.id
				  });
				  break;
			  case app.options.types.objClass.bpExecute :
				  to.execute.objects.push({
				    obj : from.id,
				    costPerTask : (options) ? options.costPerTask : false,
				    costValue : (options) ? options.costValue : 0,
				    priority : (options) ? options.priority : 0
				  });
				  break;
			  default :
				  if (to.objClass == app.options.types.objClass.bpInOut) {
					  from.output.objects.push({
						  obj : to.id
					  });
				  } else {
					  from.next.objects.push({
					    obj : to.id,
					    transferTimeMin : (options && options.transferTimeMin) ? options.transferTimeMin : 0,
					    transferTimeMax : (options && options.transferTimeMax) ? options.transferTimeMax : 0,
					    transferMult : (options && options.transferMult) ? options.transferMult : app.options.types.timeMult.minute,
					    allocationPercent : (options && options.allocationPercent) ? options.allocationPercent : (from.next.objects.length == 0) ? 100 : 0
					  });
					  to.prior.objects.push({
					    obj : from.id,
					    localPriority : 0
					  });
				  }
		  };
	  },
	  unlink : function(fromId, toId) {
		  var inxOf = function(objects, obj) {
			  return $.map(objects, function(val) {
				  return val.obj
			  }).indexOf(obj.id)
		  };
		  var from = app.model.objects[fromId], to = app.model.objects[toId]
		  switch (from.objClass) {
			  case app.options.types.objClass.bpRegulate :
				  to.regulate.objects.splice(inxOf(to.regulate.objects, from), 1);
				  break;
			  case app.options.types.objClass.bpSupport :
				  to.support.objects.splice(inxOf(to.support.objects, from), 1);
				  break;
			  case app.options.types.objClass.bpInOut :
				  to.input.objects.splice(inxOf(to.input.objects, from), 1);
				  break;
			  case app.options.types.objClass.bpExecute :
				  to.execute.objects.splice(inxOf(to.execute.objects, from), 1);
				  break;
			  default :
				  if (to.objClass == app.options.types.objClass.bpInOut) {
					  from.output.objects.splice(inxOf(from.output.objects, to), 1);
				  } else {
					  to.prior.objects.splice(inxOf(to.prior.objects, from), 1);
					  from.next.objects.splice(inxOf(from.next.objects, to), 1);
				  }
		  };
	  },
	  testToRecive : function(fromId, toId) {
		  var from = app.model.objects[fromId], to = app.model.objects[toId];
		  var indOf = function(collection, obj) {
			  return $.inArray(obj.id, collection.map(function(element) {
				  return element.obj
			  }))
		  };
		  if (from === to)
			  return false;
		  if (from.objType === app.options.types.objType.bpObject) {
			  if (to.objType === app.options.types.objType.bpObject && indOf(to.prior.objects, from) == -1)
				  return true
			  else if (to.objClass === app.options.types.objClass.bpInOut && from.objClass === app.options.types.objClass.bpFunction && indOf(from.output.objects, to) == -1)
				  return true
		  } else if (from.objType === app.options.types.objType.bpSubject && to.objClass === app.options.types.objClass.bpFunction) {
			  if (from.objClass === app.options.types.objClass.bpInOut && indOf(to.input.objects, from) == -1)
				  return true
			  switch (from.objClass) {
				  case app.options.types.objClass.bpRegulate :
					  if (indOf(to.regulate.objects, from) == -1)
						  return true
					  break;
				  case app.options.types.objClass.bpExecute :
					  if (indOf(to.execute.objects, from) == -1)
						  return true
					  break;
				  case app.options.types.objClass.bpSupport :
					  if (indOf(to.support.objects, from) == -1)
						  return true
					  break;
			  }
		  }
		  return false
	  },
	  newModel : function() {
		  app.model = app.options.newModel();
		  $.extend(app.model.info, {
		    id : app.helper.generateId(),
		    name : app.helper.trans("Model Name"),
		    lastSaved : null,
		    created : null,
		    revision : 0
		  });
		  app.model.objects = {};
	  },
	  serialize : function(model) {
		  var str;
		  try {
			  str = JSON.stringify(model);
		  } catch (err) {
			  app.snackbar.show("Save bug", null, app.options.types.messageType.critical, null);
			  app.events.error("name: " + err.name + "\nmessage: " + err.message + "\nstack: " + err.stack, true);
		  }
		  return str;
	  },
	  unserialize : function(data) {
		  var model = JSON.parse(data);
		  return model
	  },
	  load : function(model) {
		  var obj;
		  function compareVersions(a, b) {
			  var v1 = a.split("."), v2 = b.split("."), i, res;
			  for (i = 0; i < Math.min(v1.length, v2.length); i++) {
				  res = v1[i] - v2[i];
				  if (res != 0)
					  return res;
			  }
			  return 0;
		  };
		  if ($.isPlainObject(model) === false)
			  model = app.core.unserialize(model);
		  try {
			  if (typeof model == 'undefined' || model === null || typeof model.info == 'undefined')
				  throw new Error("Can't load model's meta info");
		  } catch (err) {
			  app.snackbar.show("Load bug", null, app.options.types.messageType.critical, null);
			  app.events.error("name: " + err.name + "\nmessage: " + err.message + "\nstack: " + err.stack, true);
			  return;
		  }
		  if (compareVersions(app.options.coreVersion, (model.info.coreVersion) ? model.info.coreVersion : "0") > 0) {
			  for (obj in model.objects) {
				  model.objects[obj] = $.extend(true, {}, app.options.newObject(model.objects[obj]["objClass"]), model.objects[obj]);// upgrade_data_structure
			  }
			  model.info.coreVersion = app.options.coreVersion;
		  }
		  this.newModel();
		  $.extend(app.model, model);
	  }
	}
}());