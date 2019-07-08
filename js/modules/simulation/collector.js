;
window.app = window.app || {};
window.app.simulation = window.app.simulation || {};
app.simulation.collector = (function() {
	var tasks = [];
	var range = function(time) {
		var tm = new Date(time);
		return tm.setHours(tm.getHours(), 0, 0, 0);
	}
	var addtask = function(task) {
		var i, found = false, item, tm = new Date(task.created), range = tm.setHours(tm.getHours(), 0, 0, 0);
		for (i = tasks.length - 1; i > -1; i--) {
			item = tasks[i];
			if (item.range == range && item.source == task.source) {
				item.count++;
				found = true;
				break;
			}
		};
		if (!found)
			tasks.push({
			  range : range,
			  source : task.source,
			  count : 1
			})
	};
	var createdFinished = [];
	var setCrFin = function(event) {
		var item = $.grep(createdFinished, function(val) {
			return val.range == range(event.time) && val.action == event.type
		})[0];
		if (item === undefined) {
			createdFinished.push({
			  range : range(event.time),
			  action : event.type,
			  count : 1
			})
		} else {
			item.count++
		}
	};
	var sumexec = 0;
	var waitQLength = [];
	var setwaitQLength = function() {
		var i, sum = 0, minutes = app.simulation.execute.time();
		sumexec = 0;
		minutes = minutes.getHours() * 60 + minutes.getMinutes();
		for (i in app.model.objects) {
			if (app.model.objects[i].objClass == app.options.types.objClass.bpFunction && app.model.objects[i]._simulation && app.model.objects[i]._simulation.stockQueue) {
				// if (app.model.objects[i]._simulation.stockQueue)
				sum += app.model.objects[i]._simulation.stockQueue.length;
				sumexec += app.model.objects[i]._simulation.workQueue.length;
			}
		};
		waitQLength.push({
		  minutes : minutes,
		  count : sum
		});
	};
	var taskStat = {
	  processSum : 0,
	  deliverySum : 0,
	  waitingSum : 0,
	  cicleTimeSum : 0,
	  count : 0,
	  cicleCount : 0
	};
	var lastCicleTime;
	var setTaskStat = function(task) {
		taskStat.processSum += task.work;
		taskStat.deliverySum += task.transfer;
		taskStat.waitingSum += task.waitInQueue + task.waitInAssign;
		if (lastCicleTime) {
			taskStat.cicleTimeSum += ((new Date(task.last)).getTime() - (new Date(lastCicleTime)).getTime()) / 1000;
			taskStat.cicleCount++;
		}
		taskStat.count++;
		lastCicleTime = new Date(task.last);
	};
	var maxResourceWorkTime = 0;
	var sumGeneratedTaskPerDay = 0;
	var calcStatic = function() {
		var id, i, obj, restime;
		maxResourceWorkTime = 0;
		sumGeneratedTaskPerDay = 0;
		for (id in app.model.objects) {
			obj = app.model.objects[id];
			if (obj.objClass == app.options.types.objClass.bpExecute) {
				restime = 0;
				for (i = 0; i < obj.timeRanges.length; i++) {
					restime += obj.timeRanges[i].toSec - obj.timeRanges[i].fromSec;
				}
				maxResourceWorkTime = Math.max(restime, maxResourceWorkTime)
			} else if (obj.objClass == app.options.types.objClass.bpGenerator) {
				for (i = 0; i < obj.timeRanges.length; i++) {
					sumGeneratedTaskPerDay += obj.timeRanges[i].count
				}
			}
		}
	};
	var costingSum;
	return {
	  init : function(time) {
		  waitings = [];
		  createdFinished = [];
		  waitQLength = [];
		  lastCicleTime = null;
		  costingSum = 0;
		  taskStat = {
		    processSum : 0,
		    deliverySum : 0,
		    waitingSum : 0,
		    cicleTimeSum : 0,
		    count : 0,
		    cicleCount : 0
		  };
	  },
	  recalc : function() {
		  calcStatic();
	  },
	  // setTask : addTask,
	  setCrFin : setCrFin,
	  getCrFin : function() {
		  return createdFinished
	  },
	  endOfTakt : function() {
		  setwaitQLength();
	  },
	  getwaitQLength : function() {
		  return waitQLength
	  },
	  getWorkQlen : function() {
		  return sumexec
	  },
	  setTaskStat : setTaskStat,
	  getTaskStat : function() {
		  return taskStat
	  },
	  getTaktTime : function() {
		  return (sumGeneratedTaskPerDay == 0) ? 0 : maxResourceWorkTime / sumGeneratedTaskPerDay
	  },
	  getCicleTime : function() {
		  return taskStat.cicleCount == 0 ? 0 : taskStat.cicleTimeSum / taskStat.cicleCount
	  },
	  setCostSum : function(sum) {
		  costingSum += sum;
	  },
	  getCostSum : function() {
		  return costingSum;
	  }
	}
}());