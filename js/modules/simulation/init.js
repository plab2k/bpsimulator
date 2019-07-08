;
window.app = window.app || {};
window.app.simulation = window.app.simulation || {};
app.simulation.init = (function() {
    var path = [],
        taskId, rate;

    function route(id) {
        var i, obj = app.model.objects[id];
        if (typeof obj == "undefined" || obj._simulation.executed)
            return;
        obj._simulation.routedcount++;
        if (obj.prior.objects.length == 0 || obj._simulation.routedcount == obj.prior.objects.length) {
            obj._simulation.executed = true;
            // console.log(obj.name, "route")
            path.push(obj.id);
            for (i = 0; i < obj.next.objects.length; i++) {
                route(obj.next.objects[i].obj)
            }
        }
    };

    function testFeedBack(id) {
        var i, obj = app.model.objects[id];
        // console.log(obj.name, "test");
        if (obj._simulation.fbtested)
            return false;
        obj._simulation.fbtested = true;
        if (obj.next && obj.next.objects.length > 0) {
            for (i = 0; i < obj.next.objects.length; i++) {
                if (app.model.objects[obj.next.objects[i].obj]._simulation.executed === false) {
                    route(obj.next.objects[i].obj);
                    return true;
                } else
                    return testFeedBack(obj.next.objects[i].obj)
            }
        } else
            return false
    };

    function cleartest() {
        var i;
        for (i in app.model.objects) {
            if (app.model.objects[i].objType == app.options.types.objType.bpObject)
                app.model.objects[i]._simulation.fbtested = false
        }
    };
    return {
        setup: function(time) {
            var i, r, beginners = app.helper.tree.beginners,
                len = beginners.length,
                fbresult, obj;
            path = [];
            taskId = 0;
            rate = 86400;
            for (i in app.model.objects) {
                obj = app.model.objects[i];
                if (obj.objType == app.options.types.objType.bpObject)
                    obj._simulation = {
                        routedcount: 0,
                        executed: false,
                        passedCount: 0,
                        lastRunTime: new Date(time)
                    }
                else
                    obj._simulation = {};
                if (obj.timeRanges) {
                    obj.timeRanges.sort(function(a, b) {
                        return a.fromSec - b.fromSec
                    })
                };
                // if (obj.objClass == app.options.types.objClass.bpGenerator)
                if (obj.objClass == app.options.types.objClass.bpFunction) {
                    obj._simulation.stockQueue = [];
                    obj._simulation.workQueue = [];
                    obj._simulation.tranferQueue = [];
                    obj._simulation.ANDwaitQueue = {};
                    rate = Math.min(rate, obj.runTimeMult);
                };
                if (obj.objClass == app.options.types.objClass.bpExecute) {
                    obj._simulation.resources = [];
                    for (r = 0; r < obj.count; r++) {
                        obj._simulation.resources.push(new Date(time));
                    }
                    obj._simulation.execTime = 0;
                    obj._simulation.execTimeDay = 0;
                    obj._simulation.execCost = 0;
                    obj._simulation.utilizationTimePerDay = obj.timeRanges.length == 0 ? 60 * 60 * 24 : $.map(obj.timeRanges, function(o) {
                        return o.toSec - o.fromSec
                    }).reduce(function(a, b) {
                        return a + b
                    }) * obj.count;
                    obj._simulation.utilizationTime = obj._simulation.utilizationTimePerDay;
                };
                if (obj.objClass == app.options.types.objClass.bpSupport) {
                    obj._simulation.execCount = 0;
                    obj._simulation.execTime = 0;
                };
                if (obj.objClass == app.options.types.objClass.bpCheckPoint) {
                    obj._simulation.tranferQueue = [];
                    obj._simulation.sumTaskCost = 0;
                    obj._simulation.sumTaskTime = 0;
                    obj._simulation.sumTaskCount = 0;
                };
                if (obj._simulation.logBuffer)
                    obj._simulation.logBuffer = [];
            };
            for (i = 0; i < len; i++) {
                route(beginners[i]);
            };
            for (i = 0; i < len; i++) {
                fbresult = true;
                while (fbresult) {
                    cleartest();
                    fbresult = testFeedBack(beginners[i]);
                }
            };
            return path
        },
        getTaskId: function() {
            return ++taskId
        },
        getpath: function() {
            return path
        },
        getorder: function() {
            return $.map(path, function(val) {
                return app.model.objects[val].name
            })
        },
        getSimulationRate: function() {
            if (rate === undefined)
                this.setup(new Date())
            return rate;
        }
    }
}());