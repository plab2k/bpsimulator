window.app = window.app || {};
window.app.simulation = window.app.simulation || {};
app.simulation.execute = (function () {
    "use strict";
    var runTime,
        distrStore = {};

    var getTimeArray = function (objId, rangeId, init, count, mult, method) {
        var arr = [];
        //TODO cache arrays in sessionStorage
        if (distrStore.objId != "undefined" && distrStore.rangeId != "undefined" && distrStore.count != "undefined" && distrStore.distrType != "undefined" && distrStore.objId == objId && distrStore.rangeId == rangeId && distrStore.count == count && distrStore.distrType == method) arr = distrStore.value;
        else {
            arr = app.dstr.set(init, count, mult, method);
            distrStore = {
                objId: objId,
                rangeId: rangeId,
                count: count,
                distrType: method,
                value: arr
            };
        }
        return arr;
    };

    function newTask(obj, time) {
        const batchSize = obj.batchSize || 1;
        for (let i = 0; i < batchSize; i++) {
            let task = {
                id: app.simulation.init.getTaskId(),
                begin: new Date(time.valueOf()),
                last: new Date(time.valueOf()),
                source: obj.id,
                globalPriority: obj.globalPriority,
                localPriority: 0,
                waitInQueue: 0,
                waitInAssign: 0,
                work: 0,
                transfer: 0,
                cost: 0
            };
            app.simulation.log.add({
                time: task.last,
                type: app.options.types.eventType.taskNew,
                task: task,
                source: obj.id
            });
            transfer(obj.id, task);
            obj._simulation.passedCount++;
        }
    }

    function processTimePeriods(obj, fromTime, toTime) {
        let lastime = fromTime;
        const periods = obj.timeRanges;
        const sec = function (seconds) {
            return app.helper.setDaySeconds(fromTime, seconds);
        };
        globFor: for (let i = 0; i < periods.length; i++) {
            const period = periods[i];
            if (sec(period.fromSec) <= lastime) {
                if (sec(period.toSec) > lastime) {
                    const timeAray = getTimeArray(obj.id, i, period.fromSec, period.count / (obj.batchSize || 1), period.toSec - period.fromSec, period.distrType);
                    for (let ii = 0; ii < timeAray.length; ii++) {
                        const curtime = sec(timeAray[ii]);
                        lastime = sec(timeAray[ii]);
                        if (curtime < toTime) {
                            if (curtime >= fromTime) {
                                newTask(obj, lastime);
                            } else continue;
                        } else {
                            break globFor;
                        }
                    }
                }
            } else {
                //пропуск первых периодов
                lastime = sec(period.fromSec);
                break;
            }
        }
        if (lastime < toTime) {
            //next day
            lastime = periods.length > 0 ? app.helper.setDaySeconds(new Date(new Date(fromTime.valueOf()).setDate(fromTime.getDate() + 1)), periods[0].fromSec) : toTime;
            return processTimePeriods(obj, lastime, toTime);
        } else return lastime;
    }

    function transfer(fromId, task) {
        var obj = app.model.objects[fromId],
            i,
            double,
            rnd,
            rndsum,
            len;
        var transferTo = function (fromId, toId, task, transferTime) {
            var toobj = app.model.objects[toId];
            task.last = app.helper.setAddSeconds(task.last, transferTime);
            task.transfer += transferTime;
            task.localPriority = $.map(toobj.prior.objects, function (val) {
                return val.obj;
            }).indexOf(fromId);
            if (toobj._simulation.tranferQueue) {
                toobj._simulation.tranferQueue.push(task);
            } else {
                // transparent
                transfer(toId, task);
            }
        };
        if (obj.next.objects.length == 0) {
            // Finished
            app.simulation.log.add({
                time: task.last,
                type: app.options.types.eventType.taskFinished,
                task: task,
                source: obj.id
            });
            return;
        } else if (obj.next.objects.length == 1) {
            transferTo(fromId, obj.next.objects[0].obj, task, parseInt(obj.next.objects[0].transferMult * (Math.random() * (obj.next.objects[0].transferTimeMax - obj.next.objects[0].transferTimeMin) + obj.next.objects[0].transferTimeMin)));
        } else if (obj.next.allocLogic == app.options.types.logic.XOR) {
            // XOR
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
        } else if (obj.next.allocLogic == app.options.types.logic.AND) {
            // AND
            for (var i = 0; i < obj.next.objects.length; i++) {
                double = $.extend(true, {}, task);
                transferTo(fromId, obj.next.objects[i].obj, double, parseInt(obj.next.objects[i].transferMult * (Math.random() * (obj.next.objects[i].transferTimeMax - obj.next.objects[i].transferTimeMin) + obj.next.objects[i].transferTimeMin)));
            }
        }
    }

    function runGenerator(obj) {
        if (obj._simulation.lastRunTime <= runTime) obj._simulation.lastRunTime = processTimePeriods(obj, obj._simulation.lastRunTime, runTime);
    }

    function runFunction(obj) {
        var i,
            len,
            task,
            // Транспортировка
            len = obj._simulation.tranferQueue.length;
        for (i = len - 1; i >= 0; i--) {
            if (obj._simulation.tranferQueue[i]["last"] <= runTime) {
                task = obj._simulation.tranferQueue[i];
                app.simulation.log.add({
                    time: task.last,
                    type: app.options.types.eventType.taskDelivered,
                    task: task,
                    source: obj.id
                });
                obj._simulation.tranferQueue.splice(i, 1);
                if (obj.prior.execLogic == app.options.types.logic.XOR || obj.prior.objects.length == 1) {
                    // XOR
                    obj._simulation.stockQueue.push(task);
                } else {
                    // AND logic
                    if (obj._simulation.ANDwaitQueue[task.id]) {
                        obj._simulation.ANDwaitQueue[task.id]++;
                        if (obj._simulation.ANDwaitQueue[task.id] === obj.prior.objects.length) {
                            obj._simulation.stockQueue.push(task);
                            delete obj._simulation.ANDwaitQueue[task.id];
                        }
                    } else obj._simulation.ANDwaitQueue[task.id] = 1;
                }
            }
        }
        /* очистка задач "в работе", выполненных к моменту процессного времени */
        len = obj._simulation.workQueue.length;
        for (i = len - 1; i >= 0; i--) {
            if (obj._simulation.workQueue[i]["last"] <= runTime) {
                app.simulation.log.add({
                    time: obj._simulation.workQueue[i]["last"],
                    type: app.options.types.eventType.taskComplete,
                    task: obj._simulation.workQueue[i],
                    source: obj.id
                });
                transfer(obj.id, obj._simulation.workQueue[i]);
                obj._simulation.workQueue.splice(i, 1);
                obj._simulation.passedCount++;
            }
        }
        //processTaskinFunction(obj);
        /* если не указан ресурс то выполняем сразу*/
        if (obj.execute.objects.length == 0 && obj._simulation.stockQueue.length > 0) {
            obj._simulation.stockQueue.sort(function (a, b) {
                return a.last - b.last;
            });
            let lastTime = obj._simulation.stockQueue[0].last;
            while (obj._simulation.stockQueue.length > 0) {
                if (obj.batchFill == true && obj._simulation.stockQueue.length < obj.batchSize) break;
                const part = obj._simulation.stockQueue.slice(0, obj.batchSize);
                const duration = Math.floor(obj.runTimeMult * (Math.random() * (obj.runTimeMax - obj.runTimeMin) + obj.runTimeMin));
                const startTime = new Date(Math.max(lastTime.getTime(), part[part.length - 1].last.getTime()));
                const endTime = app.helper.setAddSeconds(startTime, duration);
                for (let index = 0; index < part.length; index++) {
                    const task = part[index];
                    completeTask(obj, task, startTime, endTime, duration, null);
                }
                lastTime = new Date(endTime);
                obj._simulation.stockQueue.splice(0, obj.batchSize);
            }
        }
        assignTasksToResources();
    }

    function assignTasksToResources() {
        const filterByTime = (task) => { return task.last < runTime };
        const sortTaskByTime = (a, b) => { return a.last - b.last }
        const sortDatebYTime = (a, b) => a.getTime() - b.getTime();
        const isBatch = (item) => {
            const obj = item.func, time = item.task.last;
            return obj._simulation.stockQueue.filter(task => { return task.last <= time })
                .length >= obj.batchFill == true ? obj.batchSize : 1
        }
        const getBatch = (func) => {
            let batch = func._simulation.stockQueue.filter(filterByTime).sort(sortByTime).slice(0, func.batchSize);
            batch = (func.batchFill == true && batch.length == func.batchSize) ? batch : [];
            return batch
        }
        const assignBatch = (func, batch) => {
            return true
        }
        const getFuncList = () => {
            return Object.values(app.model.objects)
                .filter(obj =>
                    obj.objClass == app.options.types.objClass.bpFunction
                        && obj.execute.objects.length > 0
                        && obj._simulation.stockQueue.filter(filterByTime).length > (obj.batchFill == true) ? obj.batchSize - 1 : 0
                        && obj.execute.length > 0)
        }
        const getTaskTime = (funcList) => {
            let tasks = []
            funcList
                .forEach(obj => {
                    const task = obj._simulation.stockQueue.sort(sortTaskByTime)[obj.batchFill == true ? obj.batchSize - 1 : 0];
                    tasks.push(task);
                });
            return tasks.length ? tasks.sort(sortTaskByTime)[0].last : null
        };
        const getResTime = (funcList) => {
            let resources = [];
            funcList.forEach(obj => {
                obj.execute.objects.forEach(resource => {
                    const resId = resource.obj;
                    const res = app.model.objects[resId];
                    resources = resources.concat(
                        res._simulation.resources
                            .filter(time => time <= runTime))
                });
            });
            return resources.sort(sortDatebYTime)[0]
        };
        const getReslistByTime = (time) => {
            return Object.values(app.model.objects)
                .filter(obj =>
                    obj.objClass == app.options.types.objClass.bpExecute
                    && obj._simulation.resources.filter(tm => tm <= time).length > 0
                )
        };
        const getFuncListByTime = (funcList, time) => {
            return funcList.filter(obj => {
                obj.execute.objects.filter(resId => {
                    app.model.objects[resId]._simulation.resources.filter(tm => tm <= time).length > 0
                }).length > 0
            })
        };
        let hasTasks = true,
            hasResources = true;
        while (hasTasks && hasResources) {
            let funcList = getFuncList();
            const taskTime = getTaskTime(funcList);
            if (!taskTime) {
                hasTasks = false;
                break;
            }
            const resTime = getResTime(funcList);
            if (!resTime) {
                hasResources = false;
                break;
            }
            let opTime = new Date(Math.max(taskTime.getTime(), resTime.getTime()));
            funcList = getFuncListByTime(funcList, opTime);

            console.log(opTime)
            hasTasks = false;
        }
    }
    function processTaskinFunction(obj) {
        let minTaskTime,
            minResTime,
            duration,
            pool = getpool(obj);

        /* Пока есть что обрабатывать */
        while (obj._simulation.stockQueue.length > 0 && (obj.batchFill == true ? obj._simulation.stockQueue.length >= obj.batchSize : true)) {
            minTaskTime = obj._simulation.stockQueue.sort(function (a, b) {
                return a.last - b.last;
            })[obj.batchFill == true ? obj.batchSize - 1 : 0].last; // Получаем самую раннюю задачу
            minResTime = pool.getMinTime(minTaskTime);
            if (minResTime !== null && minResTime <= runTime) {
                // выбираем задачи ко времени освобождения ресурса и сортируем по приоритетам
                duration = Math.floor(obj.runTimeMult * (Math.random() * (obj.runTimeMax - obj.runTimeMin) + obj.runTimeMin));
                let tasks = obj._simulation.stockQueue
                    .filter(function (task) {
                        return task.last <= minResTime;
                    })
                    .sort(function (a, b) {
                        // global desc, local desc, date asc
                        return a.globalPriority == b.globalPriority ? (a.localPriority == b.localPriority ? a.last - b.last : b.localPriority - a.localPriority) : b.globalPriority - a.globalPriority;
                    })
                    .slice(0, obj.batchSize || 1);
                processTask(obj, pool, tasks, minResTime, duration);
                obj._simulation.stockQueue = obj._simulation.stockQueue.filter(function (task) {
                    return tasks.indexOf(task) < 0;
                });
            } else break;
        }
    }

    function completeTask(obj, task, startTime, endTime, duration, resourceId) {
        const waitInQueue = (startTime.getTime() - task.last.getTime()) / 1000;
        const waitInAssign = (endTime - task.last.getTime()) / 1000 - duration - waitInQueue
        app.simulation.log.add({
            time: task.last,
            type: app.options.types.eventType.taskOperation,
            task: task,
            source: obj.id,
            end: endTime
        });
        task.waitInQueue += waitInQueue;
        task.waitInAssign += waitInAssign;
        task.last = new Date(endTime);
        task.localPriority = 0;
        task.work += duration;

        if (resourceId != null) {
            setExecutionCost(task, obj.id, resourceId, duration);
            app.simulation.log.add({
                time: startTime,
                type: app.options.types.eventType.taskAssigned,
                task: task,
                source: resourceId
            });
        }
        assignSupport(obj, task, duration);
        if (endTime > runTime) obj._simulation.workQueue.push(task);
        else {
            app.simulation.log.add({
                time: task.last,
                type: app.options.types.eventType.taskComplete,
                task: task,
                source: obj.id
            });
            obj._simulation.passedCount++;
            transfer(obj.id, task);
        }
    }

    function processTask(obj, pool, tasks, minResTime, duration) {
        const res = pool.assignExecutor(minResTime, duration);
        for (let ti = 0; ti < tasks.length; ti++) {
            const task = tasks[ti];
            const waiting = (minResTime.getTime() - task.last.getTime()) / 1000;
            app.simulation.log.add({
                time: task.last,
                type: app.options.types.eventType.taskOperation,
                task: task,
                source: obj.id,
                end: res[res.length - 1].endtime
            });

            for (let i = 0; i < res.length; i++) {
                const resource = res[i];
                task.waitInQueue += waiting;
                task.waitInAssign += (resource.endtime.getTime() - task.last.getTime()) / 1000 - duration - waiting;
                task.last = new Date(resource.endtime.getTime());
                task.localPriority = 0;
                task.work += duration;

                if (resource.resId != -1) {
                    setExecutionCost(task, obj.id, resource.resId, resource.duration);
                    app.simulation.log.add({
                        time: resource.starttime,
                        type: app.options.types.eventType.taskAssigned,
                        task: task,
                        source: resource.resId
                    });
                }
            }

            assignSupport(obj, task, duration);
            if (res[res.length - 1].endtime > runTime) obj._simulation.workQueue.push(task);
            else {
                app.simulation.log.add({
                    time: task.last,
                    type: app.options.types.eventType.taskComplete,
                    task: task,
                    source: obj.id
                });
                obj._simulation.passedCount++;
                transfer(obj.id, task);
            }
        }
    }

    function getpool(func) {
        const obj = func;
        //Correct min value of time by resources timeranges
        var correctBeginTime = function (time, resId) {
            var i,
                secs = time.getHours() * 60 * 60 + time.getMinutes() * 60 + time.getSeconds();
            var res = app.model.objects[resId];
            for (i = 0; i < res.timeRanges.length; i++) {
                if (secs < res.timeRanges[i].toSec)
                    if (secs < res.timeRanges[i].fromSec) return app.helper.setDaySeconds(time, res.timeRanges[i].fromSec);
                    else return time;
                else if (i == res.timeRanges.length - 1) return app.helper.setDaySeconds(new Date(time.setDate(time.getDate() + 1)), res.timeRanges[0].fromSec);
            }
        }; //get list of free resources
        var getPools = function (maxtime) {
            return $.map(obj.execute.objects, function (exec) {
                var res = app.model.objects[exec.obj];
                var mintime = correctBeginTime(
                    new Date(
                        Math.max(
                            res._simulation.resources.sort(function (a, b) {
                                return a.getTime() - b.getTime();
                            })[0],
                            maxtime
                        )
                    ),
                    res.id
                );
                return mintime <= runTime
                    ? {
                        time: mintime,
                        id: res.id,
                        priority: exec.priority
                    }
                    : null;
            });
        };
        var getEndTime = function (poolRec, start, duration) {
            var res = app.model.objects[poolRec.id];
            var sum = 0,
                cursum,
                curtime = start,
                curtimeSec,
                i,
                period,
                diff = 0;
            while (sum < duration) {
                curtime = correctBeginTime(curtime, res.id);
                curtimeSec = curtime.getHours() * 60 * 60 + curtime.getMinutes() * 60 + curtime.getSeconds();
                period = $.grep(res.timeRanges, function (r) {
                    return r.fromSec <= curtimeSec && r.toSec > curtimeSec;
                })[0];
                sum += diff = Math.min(period.toSec - curtimeSec, duration - sum);
                if (res.timeRanges.indexOf(period) == res.timeRanges.length - 1 && sum < duration) curtime = app.helper.setDaySeconds(new Date(new Date(curtime.valueOf()).setDate(curtime.getDate() + 1)), 0);
                else curtime = app.helper.setDaySeconds(curtime, curtimeSec + diff);
            }
            return { time: curtime, duration: diff };
        };
        return {
            getMinTime: function (taskTime) {
                var pool = getPools(taskTime);
                if (obj.execute.objects.length == 0)
                    //return runTime >= obj._simulation.lastRunTime ? new Date(Math.max(taskTime, obj._simulation.lastRunTime)) : null;
                    return taskTime;
                else if (pool.length == 0) return null;
                if (obj.execute.execResource == app.options.types.execResource.ALTERNATE)
                    return pool.sort(function (a, b) {
                        // asc
                        return a.time - b.time;
                    })[0].time;
                else {
                    return pool.sort(function (a, b) {
                        // desc
                        return b.time - a.time;
                    })[0].time;
                }
            },
            assignExecutor: function (start, duration) {
                const pool = getPools(start);
                const end = app.helper.setAddSeconds(start, duration);
                if (pool.length == 0) {
                    obj._simulation.lastRunTime = end;
                    return [
                        {
                            resId: -1,
                            starttime: start,
                            endtime: end,
                            duration: duration
                        }
                    ];
                }

                if (obj.execute.execResource == app.options.types.execResource.ALTERNATE) {
                    let res = pool.sort(function (a, b) {
                        // priority desc, time asc
                        return (a.priority = b.priority ? a.time - b.time : b.priority - a.priority);
                    })[0];
                    const et = getEndTime(res, start, duration);
                    app.model.objects[res.id]._simulation.resources.sort(function (a, b) {
                        return a.getTime() - b.getTime();
                    })[0] = new Date(et.time);
                    return [
                        {
                            resId: res.id,
                            starttime: res.time,
                            endtime: et.time,
                            duration: et.duration
                        }
                    ];
                } else {
                    // ПО-чесноку можно реализовать отдельную опцию одновременного выполнения работы, например игра на пианино в две руки
                    let result = [];
                    for (let i = 0; i < pool.length; i++) {
                        const et = getEndTime(pool[i], start, duration);
                        app.model.objects[pool[i].id]._simulation.resources.sort(function (a, b) {
                            return a.getTime() - b.getTime();
                        })[0] = et.time;
                        result.push({
                            resId: pool[i].id,
                            starttime: pool[i].time,
                            endtime: et.time,
                            duration: et.duration
                        });
                    }
                    return result;
                }
            }
        };
    }

    function runCheckPoint(obj) {
        var i,
            task,
            len = obj._simulation.tranferQueue.length;
        for (i = len - 1; i >= 0; i--) {
            task = obj._simulation.tranferQueue[i];
            obj._simulation.tranferQueue.splice(i, 1);
            obj._simulation.sumTaskCost += task.cost;
            obj._simulation.sumTaskTime += task.last - task.begin;
            obj._simulation.sumTaskCount++;
            if (obj.allowFilter && (obj.allowFilter.length == 0 || obj.allowFilter.indexOf(task.source) > -1)) transfer(obj.id, task);
            else
                app.simulation.log.add({
                    time: task.last,
                    type: app.options.types.eventType.taskFinished,
                    task: task,
                    source: obj.id
                });
        }
    }

    function assignSupport(func, task, time) {
        var i,
            obj,
            cost = 0,
            curcost = 0;
        for (i = 0; i < func.support.objects.length; i++) {
            obj = app.model.objects[func.support.objects[i].obj];
            obj._simulation.execCount++;
            obj._simulation.execTime += time;
            if (func.support.objects[i].costPerTask == true) curcost = func.support.objects[i].costValue;
            else curcost = (time * obj.costValue) / obj.costPeriod;
            cost += curcost;
            app.simulation.log.add({
                time: task.last,
                type: app.options.types.eventType.taskSupported,
                task: task,
                sum: curcost,
                source: func.support.objects[i].obj
            });
        }
        task.cost += cost;
        app.simulation.log.add({
            time: task.last,
            type: app.options.types.eventType.taskCostSpent,
            task: task,
            sum: cost,
            source: func.id
        });
    }

    function setExecutionCost(task, funcId, resId, duration) {
        var sum,
            func = app.model.objects[funcId],
            res = app.model.objects[resId];
        var item =
            func.execute.objects[
            $.map(func.execute.objects, function (val) {
                return val.obj;
            }).indexOf(resId)
            ];
        sum = item.costPerTask === true ? (sum = item.costValue) : (duration * res.costValue) / res.costPeriod;
        task.cost += sum;
        app.simulation.log.add({
            time: task.last,
            type: app.options.types.eventType.taskCostSpent,
            task: task,
            sum: sum,
            source: resId
        });
        res._simulation.execTime += duration;
        res._simulation.execCost += sum;
        res._simulation.execTimeDay += duration;
    }
    return {
        start: function (time) {
            var i,
                path = app.simulation.init.getpath(),
                obj;
            runTime = time;
            for (i = 0; i < path.length; i++) {
                obj = app.model.objects[path[i]];
                switch (obj.objClass) {
                    case app.options.types.objClass.bpGenerator:
                        runGenerator(obj);
                        break;
                    case app.options.types.objClass.bpFunction:
                        runFunction(obj);
                        break;
                    case app.options.types.objClass.bpCheckPoint:
                        runCheckPoint(obj);
                        break;
                    case app.options.types.objClass.bpProcedure:
                    case app.options.types.objClass.bpEvent:
                        break;
                    default:
                        throw new Error(obj.objClass + " is not supported");
                        break;
                }
            }
            //the second pass path for task assign
            for (i = 0; i < path.length; i++) {
                obj = app.model.objects[path[i]];
                switch (obj.objClass) {
                    case app.options.types.objClass.bpFunction:
                        //processTaskinFunction(obj);
                        break;
                }
            }
        },
        pool: getpool,
        time: function () {
            return runTime;
        }
    };
})();
