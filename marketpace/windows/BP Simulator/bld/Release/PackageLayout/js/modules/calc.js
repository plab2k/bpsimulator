;
window.app = window.app || {};
app.calc = (function() {
	function initCalc() {
		var i, obj;
		for (i in app.model.objects) {
			obj = app.model.objects[i];
			if (obj.objType === app.options.types.objType.bpObject) {
				obj._calc = {
				  inputProcessed : 0,
				  instanceProbability : null
				}
			}
		}
	};
	function startCalc() {
		var procStartArr = app.helper.tree.beginners;
		var i, len = procStartArr.length;
		for (i = 0; i < len; i++) {
			calcProb(procStartArr[i], 1 / len, 0);
			// calcSumCost(procStartArr[i], 0);
		}
	};
	function calcProb(id, prob, sum) {
		var i, obj = app.model.objects[id], current = (obj.prior.execLogic == app.options.types.logic.AND)
		    ? (obj._calc.instanceProbability) ? obj._calc.instanceProbability * prob : prob
		    : (obj._calc.instanceProbability) ? Math.min(1, obj._calc.instanceProbability + prob) : prob;
		var cursum = (obj._calc.instanceCostSum) ? obj._calc.instanceCostSum * obj._calc.instanceProbability : 0;
		var inputSum = prob * sum;
		obj._calc.instanceProbability = current;
		obj._calc.inputProcessed++;
		if (obj.prior.execLogic == app.options.types.logic.AND || obj.prior.objects.length < 2 || obj._calc.inputProcessed == 1)
			if (obj.prior.execLogic == app.options.types.logic.AND)
				obj._calc.instanceCostSum = sum + (obj._calc.instanceCostSum ? obj._calc.instanceCostSum : 0);
			else
				obj._calc.instanceCostSum = sum
		else {// XOR
			obj._calc.instanceCostSum = cursum + inputSum;
		};
		if (obj.objClass == app.options.types.objClass.bpFunction && obj._calc.inputProcessed == 1) {
			obj._calc.instanceCostFunc = current * app.states._execCostFunc(obj);
			obj._calc.instanceCostSum += obj._calc.instanceCostFunc;
		};
		if (obj.prior.objects.length > 1 && obj._calc.inputProcessed > obj.prior.objects.length)
			return;
		for (i in obj.next.objects) {
			calcProb(obj.next.objects[i].obj, (obj.next.allocLogic == app.options.types.logic.AND || obj.next.objects.length < 2) ? current : current * obj.next.objects[i].allocationPercent / 100,
			    obj._calc.instanceCostSum)
		}
	};
	function calcSumCost(id, sum) {
		var i, obj = app.model.objects[id];
	}
	return {
		recalculate : function() {
			initCalc();
			startCalc();
		}
	}
}());