;
window.app = window.app || {};
app.states = (function() {
	function _durationTime(obj) {
		return (obj.runTimeMult && obj.runTimeMin !== undefined && obj.runTimeMax !== undefined) ? obj.runTimeMult * (obj.runTimeMin + obj.runTimeMax) / 2 : 0
	};
	function _execCostAvg(obj) {
		// средневзвешенное значение в секунду
		var clc = function(obj, items) {
			var i, sumCost = 0, sumEmpl = 0, len = items.length, res;
			for (i = 0; i < len; i++) {
				res = app.model.objects[items[i].obj];
				sumEmpl += res.count;
				if (items[i].costPerTask && items[i].costPerTask == true)
					sumCost += _durationTime(obj) == 0 ? 0 : items[i].costValue * res.count / _durationTime(obj);
				else
					sumCost += res.costValue * res.count / res.costPeriod;
			}
			return (len == 0) ? 0 : sumCost / sumEmpl
		}
		if (!obj._calc)
			return 0;
		else if (!obj._calc.execCostAvg)
			obj._calc.execCostAvg = clc(obj, obj.execute.objects) + clc(obj, obj.support.objects);
		return obj._calc.execCostAvg;
	};
	function _TimeSum(resource, field) {
		var i, obj, sum = 0;
		for (i in app.model.objects) {
			obj = app.model.objects[i];
			if (obj[field] && $.grep(obj[field].objects, function(val) {
				return val.obj == resource.id
			}).length == 1)
				sum += (obj._calc && obj._calc.instanceProbability) ? _durationTime(obj) * obj._calc.instanceProbability : _durationTime(obj);
		}
		return sum
	};
	function _costSum(resource, field) {
		var i, obj, sum = 0, cost = resource.costValue / resource.costPeriod, item;
		for (i in app.model.objects) {
			obj = app.model.objects[i];
			if (obj[field]) {
				item = $.grep(obj[field].objects, function(val) {
					return val.obj == resource.id
				});
				if (item.length == 1) {
					if (item[0].costPerTask === true)
						sum += (obj._calc && obj._calc.instanceProbability) ? obj._calc.instanceProbability * item[0].costValue : item[0].costValue;
					else
						sum += (obj._calc && obj._calc.instanceProbability) ? _durationTime(obj) * obj._calc.instanceProbability * cost : _durationTime(obj) * cost;
				}
			}
		}
		return sum
	};
	function _execCostSum(resource, field) {
		// в секунду
		return _costSum(resource, field)
	};
	return {
	  transLength : function(obj) {
		  return (obj._simulation && obj._simulation.tranferQueue) ? obj._simulation.tranferQueue.length : 0
	  },
	  stockLength : function(obj) {
		  return (obj._simulation && obj._simulation.stockQueue) ? obj._simulation.stockQueue.length : 0
	  },
	  workLength : function(obj) {
		  return (obj._simulation && obj._simulation.workQueue) ? obj._simulation.workQueue.length : 0
	  },
	  passedCount : function(obj) {
		  return (obj._simulation && obj._simulation.passedCount) ? obj._simulation.passedCount : 0
	  },
	  utilisationRate : function(obj) {
		  return 0
	  },
	  emplCount : function(obj) {
		  return obj.count
	  },
	  emplSum : function(obj) {
		  var i, len = obj.execute.objects.length, sum = 0;
		  for (i = 0; i < len; i++) {
			  sum += app.model.objects[obj.execute.objects[i].obj].count
		  }
		  return sum
	  },
	  durationTime : function(obj) {
		  return _durationTime(obj).toString().toHHMMSS()
	  },
	  instanceProbability : function(obj) {
		  return (obj._calc && obj._calc.instanceProbability) ? parseInt(obj._calc.instanceProbability * 100) : 0
	  },
	  // стоимость ресурса в час
	  execCost : function(obj) {
		  return Globalize.format(obj.costValue, "c")
	  },
	  execCostAvg : function(obj) {
		  // стоимость выполнения в час
		  return Globalize.format(_execCostAvg(obj) * 60 * 60, "c")
	  },
	  _execCostFunc : function(obj) {
		  return _durationTime(obj) * _execCostAvg(obj)
	  },
	  execCostFunc : function(obj) {
		  return Globalize.format(app.states._execCostFunc(obj), "c")
	  },
	  // стоимость выполнения функции в инстансе
	  _instanceCostFunc : function(obj) {
		  return (obj._calc) ? obj._calc.instanceCostFunc : 0
	  },
	  instanceCostFunc : function(obj) {
		  return Globalize.format(app.states._instanceCostFunc(obj), "c")
	  },
	  instanceCostSum : function(obj) {
		  if (obj._calc) {
			  return Globalize.format(obj._calc.instanceCostSum, "c");
		  } else
			  return 0
	  },
	  execTimeSum : function(obj) {
		  return _TimeSum(obj, (obj.objClass == app.options.types.objClass.bpExecute) ? "execute" : "support").toString().toHHMMSS()
	  },
	  execCostSum : function(obj) {
		  return Globalize.format(_execCostSum(obj, (obj.objClass == app.options.types.objClass.bpExecute) ? "execute" : "support"), "c")
	  },
	  execUtilisation : function(obj) {
		  return obj._simulation && obj._simulation.resources ? parseInt(100 * (1 - $.grep(obj._simulation.resources, function(tr) {
			  return tr <= app.simulation.execute.time()
		  }).length / obj._simulation.resources.length)) + "%" : "";
	  },
	  // количество вызовов саппорта
	  suppExecCount : function(obj) {
		  return obj._simulation ? obj._simulation.execCount : null
	  },
	  // средняя стоимость выполнения задачи
	  avgTaskCost : function(obj) {
		  return obj._simulation ? Globalize.format(obj._simulation.sumTaskCount > 0 ? obj._simulation.sumTaskCost / obj._simulation.sumTaskCount : 0, "c") : null;
	  },
	// сумма выполнения задач
	  sumTaskCost : function(obj) {
		  return obj._simulation ? Globalize.format(obj._simulation.sumTaskCost||0, "c") : null;
	  },
	  //среднее время с начала выполнения задачи
	  avgTaskTime:function(obj){
	  	return obj._simulation ? (obj._simulation.sumTaskCount>0?0.001*obj._simulation.sumTaskTime/obj._simulation.sumTaskCount:0).toString().toHHMMSS(): null;
	  }
	}
}());