;
window.app = window.app || {};
window.app.simulation = window.app.simulation || {};
app.simulation.execute = (function() {
	var runTime, getday = null;
	function transfer(fromId, task) {
		var obj = app.model.objects[fromId], i, double, rnd, rndsum, len;
		var transferTo = function(fromId, toId, task, transferTime) {
			var toobj = app.model.objects[toId];
			task.last = app.helper.setAddSeconds(task.last, transferTime);
			task.transfer += transferTime;
			task.localPriority = $.map(toobj.prior.objects, function(val) {
				return val.obj
			}).indexOf(fromId);
			if (toobj._simulation.tranferQueue) {
				toobj._simulation.tranferQueue.push(task)
			} else {// transparent
				transfer(toId, task);
			}
		};
		if (obj.next.objects.length == 0) {// Finished
			app.simulation.log.add({
			  time : task.last,
			  type : app.options.types.eventType.taskFinished,
			  task : task,
			  source : obj.id
			});
			return;
		} else if (obj.next.objects.length == 1) {
			transferTo(fromId, obj.next.objects[0].obj, task, parseInt(obj.next.objects[0].transferMult * (Math.random() * (obj.next.objects[0].transferTimeMax - obj.next.objects[0].transferTimeMin) + obj.next.objects[0].transferTimeMin)))
		} else if (obj.next.allocLogic == app.options.types.logic.XOR) {// XOR
			rnd = Math.random();
			rndsum = 0;
			len = obj.next.objects.length;
			for (var i = 0; i < len; i++) {
				rndsum += 0.01 * (obj.next.objects[i].allocationPercent || 0);
				if (rnd < rndsum || i == len - 1) {
					transferTo(fromId, obj.next.objects[i].obj, task, parseInt(obj.next.objects[i].transferMult * (Math.random() * (obj.next.objects[i].transferTimeMax - obj.next.objects[i].transferTimeMin) + obj.next.objects[i].transferTimeMin)));
					break;
				}
			}
		} else if (obj.next.allocLogic == app.options.types.logic.AND) {// AND
			for (var i = 0; i < obj.next.objects.length; i++) {
				double = $.extend({}, task);
				transferTo(fromId, obj.next.objects[i].obj, double, parseInt(obj.next.objects[i].transferMult * (Math.random() * (obj.next.objects[i].transferTimeMax - obj.next.objects[i].transferTimeMin) + obj.next.objects[i].transferTimeMin)));
			}
		}
	};
	function runGenerator(obj) {
		var i, trlen = obj.timeRanges.length, firstTime, task;
		var getPeriod = function(timeRange) {
			var takt = (timeRange.toSec - timeRange.fromSec) / timeRange.count;
			if (obj.allocation == app.options.types.timing.RANDOM)
				takt = Math.random() * takt * 2;
			return parseInt(takt)
		};
		if (runTime < app.helper.setDaySeconds(runTime, obj.timeRanges.length == 0 ? 0 : obj.timeRanges[0].fromSec))
			obj._simulation.lastRunTime = app.helper.setDaySeconds(runTime, obj.timeRanges.length == 0 ? 0 : obj.timeRanges[0].fromSec);
		while (runTime >= obj._simulation.lastRunTime) {
			for (i = 0; i < trlen; i++) {
				if (app.helper.setDaySeconds(runTime, obj.timeRanges[i].toSec) > obj._simulation.lastRunTime && app.helper.setDaySeconds(runTime, obj.timeRanges[i].fromSec) <= obj._simulation.lastRunTime) {
					obj._simulation.passedCount++;
					task = {
					  id : app.simulation.init.getTaskId(),
					  begin : new Date(obj._simulation.lastRunTime.valueOf()),
					  last : new Date(obj._simulation.lastRunTime.valueOf()),
					  source : obj.id,
					  globalPriority : obj.globalPriority,
					  localPriority : 0,
					  waitInQueue : 0,
					  waitInAssign : 0,
					  work : 0,
					  transfer : 0,
					  cost : 0
					};
					app.simulation.log.add({
					  time : task.last,
					  type : app.options.types.eventType.taskNew,
					  task : task,
					  source : obj.id
					});
					transfer(obj.id, task);
					obj._simulation.lastRunTime = app.helper.setAddSeconds(obj._simulation.lastRunTime, getPeriod(obj.timeRanges[i]));
					break;
				} else if (app.helper.setDaySeconds(runTime, obj.timeRanges[i].toSec) > obj._simulation.lastRunTime) {
					obj._simulation.lastRunTime = app.helper.setDaySeconds(runTime, obj.timeRanges[i].fromSec);
					break;
				} else if (i == trlen - 1) {
					obj._simulation.lastRunTime = app.helper.setDaySeconds(new Date(new Date(runTime.valueOf()).setDate(runTime.getDate() + 1)), obj.timeRanges[0].fromSec);
				}
			};
		}
	};
	function runFunction(obj) {
		var i, len, pool = resourcePool(obj), minTaskTime, minResTime, task, duration, endtime, waiting = 0;
		// Транспортировка
		len = obj._simulation.tranferQueue.length;
		for (i = len - 1; i >= 0; i--) {
			if (obj._simulation.tranferQueue[i]['last'] <= runTime) {
				task = obj._simulation.tranferQueue[i];
				app.simulation.log.add({
				  time : task.last,
				  type : app.options.types.eventType.taskDelivered,
				  task : task,
				  source : obj.id
				});
				obj._simulation.tranferQueue.splice(i, 1);
				if (obj.prior.execLogic == app.options.types.logic.XOR || obj.prior.objects.length == 1) {// XOR
					obj._simulation.stockQueue.push(task);
				} else {// AND logic
					if (obj._simulation.ANDwaitQueue[task.id]) {
						obj._simulation.ANDwaitQueue[task.id]++;
						if (obj._simulation.ANDwaitQueue[task.id] === obj.prior.objects.length) {
							obj._simulation.stockQueue.push(task);
							delete obj._simulation.ANDwaitQueue[task.id];
						}
					} else
						obj._simulation.ANDwaitQueue[task.id] = 1;
				}
			}
		}
		/* очистка задач "в работе", выполненных к моменту процессного времени */
		len = obj._simulation.workQueue.length;
		for (i = len - 1; i >= 0; i--) {
			if (obj._simulation.workQueue[i]['last'] <= runTime) {
				app.simulation.log.add({
				  time : obj._simulation.workQueue[i]['last'],
				  type : app.options.types.eventType.taskComplete,
				  task : obj._simulation.workQueue[i],
				  source : obj.id
				});
				transfer(obj.id, obj._simulation.workQueue[i])
				obj._simulation.workQueue.splice(i, 1);
				obj._simulation.passedCount++;
			}
		};
		/* Пока есть что обрабатывать */
		while (obj._simulation.stockQueue.length > 0) {
			minTaskTime = obj._simulation.stockQueue.sort(function(a, b) {
				return a.last - b.last
			})[0].last;// Получаем самую раннюю задачу
			minResTime = pool.getMinTime(minTaskTime);
			if (minResTime !== null) {// выбираем задачи ко времени освобождения ресурса и сортируем по приоритетам
				task = $.grep(obj._simulation.stockQueue, function(task) {
					return task.last <= minResTime
				}).sort(function(a, b) {// global desc, local desc, date asc
					return a.globalPriority == b.globalPriority ? a.localPriority == b.localPriority ? a.last - b.last : b.localPriority - a.localPriority : b.globalPriority - a.globalPriority;
				})[0];
				duration = Math.floor(obj.runTimeMult * (Math.random() * (obj.runTimeMax - obj.runTimeMin) + obj.runTimeMin));
				waiting = (minResTime.getTime() - task.last.getTime()) / 1000;
				task.waitInQueue += waiting;
				endtime = pool.assign(task, minResTime, duration, obj.id);
				task.waitInAssign += (endtime.getTime() - task.last.getTime()) / 1000 - duration - waiting;
				task.last = new Date(endtime.getTime());
				task.localPriority = 0;
				task.work += duration;
				obj._simulation.stockQueue.splice(obj._simulation.stockQueue.indexOf(task), 1);
				assignSupport(obj, task, duration);
				if (endtime > runTime)
					obj._simulation.workQueue.push(task);
				else {
					app.simulation.log.add({
					  time : task.last,
					  type : app.options.types.eventType.taskComplete,
					  task : task,
					  source : obj.id
					});
					obj._simulation.passedCount++;
					transfer(obj.id, task);
				};
			} else
				break;
		};
	};
	function runCheckPoint(obj) {
		var i, task, len = obj._simulation.tranferQueue.length;
		for (i = len - 1; i >= 0; i--) {
			task = obj._simulation.tranferQueue[i];
			obj._simulation.tranferQueue.splice(i, 1);
			obj._simulation.sumTaskCost += task.cost;
			obj._simulation.sumTaskTime += task.last - task.begin;
			obj._simulation.sumTaskCount++;
			if (obj.allowFilter && (obj.allowFilter.length == 0 || obj.allowFilter.indexOf(task.source) > -1))
				transfer(obj.id, task);
			else
				app.simulation.log.add({
				  time : task.last,
				  type : app.options.types.eventType.taskFinished,
				  task : task,
				  source : obj.id
				});
		}
	};
	function resourcePool(obj) {
		var obj = obj;
		var correctBeginTime = function(time, resId) {
			var i, secs = time.getHours() * 60 * 60 + time.getMinutes() * 60 + time.getSeconds();
			var res = app.model.objects[resId];
			for (i = 0; i < res.timeRanges.length; i++) {
				if (secs < res.timeRanges[i].toSec)
					if (secs < res.timeRanges[i].fromSec)
						return app.helper.setDaySeconds(time, res.timeRanges[i].fromSec)
					else
						return time
				else if (i == res.timeRanges.length - 1)
					return app.helper.setDaySeconds(new Date(time.setDate(time.getDate() + 1)), res.timeRanges[0].fromSec)
			}
		};
		var pools = function(maxtime) {
			return $.map(obj.execute.objects, function(exec) {
				var res = app.model.objects[exec.obj];
				var mintime = correctBeginTime(new Date(Math.max(res._simulation.resources.sort()[0], maxtime)), res.id);
				return mintime <= runTime ? {
				  time : mintime,
				  id : res.id,
				  priority : exec.priority
				} : null
			})
		};
		var endTime = function(poolRec, start, duration) {
			var res = app.model.objects[poolRec.id];
			var sum = 0, cursum, curtime = start, curtimeSec, i, period, diff;
			while (sum < duration) {
				curtime = correctBeginTime(curtime, res.id);
				curtimeSec = curtime.getHours() * 60 * 60 + curtime.getMinutes() * 60 + curtime.getSeconds()
				period = $.grep(res.timeRanges, function(r) {
					return r.fromSec <= curtimeSec && r.toSec > curtimeSec
				})[0];
				sum += diff = Math.min(period.toSec - curtimeSec, duration - sum);
				if (res.timeRanges.indexOf(period) == res.timeRanges.length - 1 && sum < duration)
					curtime = app.helper.setDaySeconds(new Date(new Date(curtime.valueOf()).setDate(curtime.getDate() + 1)), 0);
				else
					curtime = app.helper.setDaySeconds(curtime, curtimeSec + diff);
			}
			return curtime
		};
		return {
		  getMinTime : function(taskTime) {
			  var pool = pools(taskTime);
			  if (obj.execute.objects.length == 0)
				  return taskTime
			  else if (pool.length == 0)
				  return null;
			  if (obj.execute.execResource == app.options.types.execResource.ALTERNATE)
				  return pool.sort(function(a, b) {// asc
					  return a.time - b.time
				  })[0].time
			  else {
				  return pool.sort(function(a, b) {// desc
					  return b.time - a.time
				  })[0].time
			  }
		  },
		  assign : function(task, start, duration, funcId) {
			  var pool = pools(start), endtime, res, i, tasktime;
			  if (pool.length == 0)
				  return app.helper.setAddSeconds(start, duration);
			  if (obj.execute.execResource == app.options.types.execResource.ALTERNATE) {
				  res = pool.sort(function(a, b) {// priority desc, time asc
					  return a.priority = b.priority ? a.time - b.time : b.priority - a.priority
				  })[0];
				  app.simulation.log.add({
				    time : start,
				    type : app.options.types.eventType.taskAssigned,
				    task : task,
				    source : res.id
				  });
				  endtime = endTime(res, start, duration);
				  app.model.objects[res.id]._simulation.resources.sort()[0] = new Date(endtime);
				  setExecutionCost(task, funcId, res.id, duration);
			  } else {
				  // ПО-чесноку можно реализовать отдельную опцию одновременного выполнения работы, например игра на пианино в две руки
				  endtime = new Date(0);
				  for (i = 0; i < pool.length; i++) {
					  app.simulation.log.add({
					    time : start,
					    type : app.options.types.eventType.taskAssigned,
					    task : task,
					    source : pool[i].id
					  });
					  tasktime = endTime(pool[i], start, duration);
					  app.model.objects[pool[i].id]._simulation.resources.sort()[0] = tasktime;
					  endtime = new Date(Math.max(endtime, tasktime));
					  setExecutionCost(task, funcId, pool[i].id, duration);
				  };
			  }
			  return endtime
		  }
		}
	};
	function assignSupport(func, task, time) {
		var i, obj, cost = 0;
		for (i = 0; i < func.support.objects.length; i++) {
			obj = app.model.objects[func.support.objects[i].obj];
			obj._simulation.execCount++;
			obj._simulation.execTime += time;
			if (func.support.objects[i].costPerTask == true)
				cost += func.support.objects[i].costValue;
			else
				cost += time * obj.costValue / obj.costPeriod;
		};
		task.cost += cost;
		app.simulation.log.add({
		  time : task.last,
		  type : app.options.types.eventType.taskCostSpent,
		  task : task,
		  sum : cost
		});
	};
	function setExecutionCost(task, funcId, resId, duration) {
		var sum, func = app.model.objects[funcId], res = app.model.objects[resId];
		var item = func.execute.objects[$.map(func.execute.objects, function(val) {
			return val.obj
		}).indexOf(resId)];
		sum = (item.costPerTask === true) ? sum = item.costValue : duration * res.costValue / res.costPeriod;
		task.cost += sum;
		app.simulation.log.add({
		  time : task.last,
		  type : app.options.types.eventType.taskCostSpent,
		  task : task,
		  sum : sum
		});
		res._simulation.execTime += duration;
		res._simulation.execCost += sum;
		if (getday === null || getday != runTime.getDay()) {
			getday = runTime.getDay();
			res._simulation.execTimeDay = duration;
		} else
			res._simulation.execTimeDay += duration;
	};
	return {
	  start : function(time) {
		  var i, path = app.simulation.init.getpath(), obj;
		  runTime = time;
		  for (i = 0; i < path.length; i++) {
			  obj = app.model.objects[path[i]];
			  switch (obj.objClass) {
				  case app.options.types.objClass.bpGenerator :
					  runGenerator(obj);
					  break;
				  case app.options.types.objClass.bpFunction :
					  runFunction(obj);
					  break;
				  case app.options.types.objClass.bpCheckPoint :
					  runCheckPoint(obj);
					  break;
				  case app.options.types.objClass.bpProcedure :
				  case app.options.types.objClass.bpEvent :
					  break;
				  default :
					  throw new Error(obj.objClass + " is not supported")
					  break;
			  }
		  }
	  },
	  pool : resourcePool,
	  time : function() {
		  return runTime
	  }
	}
}());