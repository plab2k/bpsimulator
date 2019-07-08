;
window.app = window.app || {};
window.app.simulation = window.app.simulation || {};
app.simulation.log = (function() {
	var maxstep = 0;
	var store = function(logItem) {
		app.storage.local.saveLog(logItem.html(), null);
	}
	return {
	  add : function(event) {
		  var str;
		  var tr = app.helper.trans;
		  var obs = function(id) {
			  return app.model.objects[id].name
		  };
		  switch (event.type) {
			  case app.options.types.eventType.taskNew :
				  app.simulation.collector.setCrFin(event);
				  str = "<span>".concat(Globalize.format(event.time, "T"), "</span>", " <span>", tr("Task"), " #", event.task.id, "</span> ", tr("created in"), " <span>", obs(event.source), "</span>");
				  break;
			  case app.options.types.eventType.taskComplete :
				  str = "<span>".concat(Globalize.format(event.time, "T"), "</span>", " <span>", tr("Task"), " #", event.task.id, "</span> ", tr("completed in"), " <span>", obs(event.source), "</span>");
				  break;
			  case app.options.types.eventType.taskDelivered :
				  str = "<span>".concat(Globalize.format(event.time, "T"), "</span>", " <span>", tr("Task"), " #", event.task.id, "</span> ", tr("delivered to"), " <span>", obs(event.source), "</span>");
				  break;
			  case app.options.types.eventType.taskAssigned :
				  str = "<span>".concat(Globalize.format(event.time, "T"), "</span>", " <span>", tr("Task"), " #", event.task.id, "</span> ", tr("assigned to"), " <span>", obs(event.source), "</span>");
				  break;
			  case app.options.types.eventType.taskFinished :
				  app.simulation.collector.setCrFin(event);
				  app.simulation.collector.setTaskStat(event.task);
				  break;
			  case app.options.types.eventType.taskCostSpent :
				  app.simulation.collector.setCostSum(event.sum);
				  break;
			  default :
				  throw new Error("eventType not found: " + event.type)
				  break;
		  };
		  if (str)
			  // store($("<div>" + str.replace(/<span/, "<span class='e" + event.type + "'") + "</div>"))
			  $(document).trigger("logEvent","<div>" + str.replace(/<span/, "<span class='e" + event.type + "'") + "</div>");
	  },
	  show : function(start, isPlainText, callback) {
		  var start = start || 0, i, items = $("<ul>");
		  for (i = start; i <= maxstep; i++) {
			  app.storage.local.loadSession(app.options.keyNames.log.concat(i), function(val) {
				  if (val)
					  callback(val)
					  /*
						 * items.append($.map(val.split("<span class"), function(val) { callback("<li><span class" + val + "</li>") }).join());
						 */
			  });
		  }
	  },
	  init : function() {
	  	//$(document).trigger("logEvent", null);
		  // app.storage.local.saveLog(null, null);
	  }
	}
}());
app.simulation.log.init();