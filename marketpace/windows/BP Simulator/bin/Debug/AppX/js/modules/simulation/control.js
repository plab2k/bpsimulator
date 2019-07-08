;
window.app = window.app || {};
window.app.simulation = window.app.simulation || {};
app.simulation.control = (function() {
	var stepTime, stepTimeDiff, currentSecs, stepnum, stepcount, calctime = 0;
	var init = function() {
		var now = new Date();
		actions.inited = true;
		currentSecs = 0;
		stepnum = 0;
		stepTime = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, app.options.settings.Simulation.simstartSeconds);
		app.simulation.init.setup(stepTime);
		stepTimeDiff = app.simulation.init.getSimulationRate();
		app.simulation.log.init();
		app.simulation.collector.init(stepTime);
		$.event.trigger({
		  type : "onSimulationprogress",
		  progress : 0,
		  time : stepTime
		});
		// console.log("inited", stepTime);
	};
	var run = function() {
		stepTime = new Date(stepTime.getTime() + stepTimeDiff * 1000);
		currentSecs += stepTimeDiff;
		if (progress() >= 1)
			return;
		stepnum++;
		app.simulation.execute.start(stepTime);
		app.simulation.collector.endOfTakt();
		// console.log("run", stepTime, stepTimeDiff, progress(), stepnum);
	};
	var progress = function() {
		return currentSecs / (app.options.settings.Simulation.simdurationVal * app.options.settings.Simulation.simdurationMult)
	};
	var actions = {
	  inited : false,
	  interval : 150,
	  timer : null,
	  play : function() {
		  actions.next();
		  if (progress() < 1)
			  actions.timer = setTimeout(function() {
				  actions.play()
			  }, Math.max(10, actions.interval - calctime))
		  else
			  actions.stop()
	  },
	  stop : function() {
		  actions.pause();
		  actions.inited = false;
		  $(document).triggerHandler("onSimulationStop");
	  },
	  next : function() {
		  var start = (new Date()).getTime();
		  // console.log(calctime,new Date())
		  actions.pause();
		  if (!actions.inited)
			  init();
		  for (var i = 1; i <= stepcount; i++) {
			  run();
		  }
		  $.event.trigger({
		    type : "onSimulationprogress",
		    progress : progress(),
		    time : stepTime
		  });
		  calctime = (new Date()).getTime() - start;
	  },
	  forward : function() {
		  actions.play();
	  },
	  pause : function() {
		  if (actions.timer)
			  clearTimeout(actions.timer);
		  actions.timer = null;
	  }
	};
	return {
	  set : function(action) {
		  switch (action) {
			  case "forward" :
				  stepcount = (app.simulation.init.getSimulationRate() < 3600) ? 60 : 2;
				  actions.interval = 500;
				  break;
			  default :
				  stepcount = 1;
				  actions.interval = 100;
				  break;
		  };
		  if (["play", "next", "forward"].indexOf(action) > -1)
			  app.events.add("userAction", "simulationAction", action);
		  actions[action]();
	  },
	  stepnum : function() {
		  return stepnum;
	  }
	}
}());