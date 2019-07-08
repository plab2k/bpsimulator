;
window.app = window.app || {};
window.app.simulation = window.app.simulation || {};
app.simulation.log = (function() {
    'use strict';
    var maxstep = 0;
    var key = 0;
    let db;
    const logTableName = app.options.keyNames.logTaskName;

    const logBuffer = function(id, message) {
        const obj = app.model.objects[id];
        let buffer = obj._simulation.logBuffer = obj._simulation.logBuffer ? obj._simulation.logBuffer : [];
        buffer.unshift(message);
        if (buffer.length > app.options.settings.UI.logBufferLength)
            buffer.pop();
    };
    const init = function() {
        const dbName = 'logs';
        if (('indexedDB' in window)) {
            var request = indexedDB.open(dbName);
            request.onerror = function(event) {
                app.snackbar.show("Database error: " + event.target.errorCode, app.options.types.messageType.critical)
            };
            request.onsuccess = function(event) {
                db = app.options.db = event.target.result;
            };
            request.onupgradeneeded = function(event) {
                const db = event.target.result;
                const tables = db.objectStoreNames;
                if (!tables.contains(logTableName)) {
                    let store = db.createObjectStore(logTableName, { autoIncrement: true });
                    store.createIndex("time", "time", { unique: false });
                }
            }
        }
    };
    const store = {
        logstore: function() {
            return db.transaction(db.objectStoreNames, "readwrite").objectStore(logTableName);
        },
        add: function(rec) {
            if (navigator.serviceWorker && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({ action: "addLogTask", value: rec });

            } else {
                const ls = this.logstore();
                try {
                    ls.add(rec);
                    ls.transaction.complete;
                } catch (error) {
                    app.snackbar.show("Datastore error: " + error.message, app.options.types.messageType.critical)
                }
            }
        },
        clear: function() {
            if (navigator.serviceWorker && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({ action: "clearLogTask" })
            } else {
                const ls = this.logstore();
                ls.clear();
                ls.transaction.complete;
            }
        }
    }
    init();
    return {
        add: function(event) {
            var tr = app.helper.trans;
            var obs = function(id) {
                return app.model.objects[id].name
            };
            const eventTime = Globalize.format(event.time, "T");

            if (app.options.settings.General.isLogging) {
                store.add($.extend({
                        time: event.time.getTime(),
                        kind: event.type,
                        kindName: Object.keys(app.options.types.eventType)[event.type],
                        task: event.task.id,
                        source: event.source,
                        sourceName: app.model.objects[event.source].name
                    }, event.sum ? { sum: event.sum } : null,
                    event.duration ? { duration: event.duration } : null
                ));
            }

            switch (event.type) {
                case app.options.types.eventType.taskNew:
                    app.simulation.collector.setCrFin(event);
                    break;
                case app.options.types.eventType.taskComplete:
                    break;
                case app.options.types.eventType.taskDelivered:
                    break;
                case app.options.types.eventType.taskAssigned:
                    break;
                case app.options.types.eventType.taskFinished:
                    app.simulation.collector.setCrFin(event);
                    app.simulation.collector.setTaskStat(event.task);
                    break;
                case app.options.types.eventType.taskCostSpent:
                    app.simulation.collector.setCostSum(event.sum);
                    break;
                case app.options.types.eventType.taskOperation:
                    break;
                case app.options.types.eventType.taskSupported:
                    break;
                default:
                    throw new Error("eventType not found: " + event.type)
                    break;
            };
            if (app.options.settings.UI.isShowLog) {
                if (app.model.objects[event.source].objClass == app.options.types.objClass.bpFunction && event.type == app.options.types.eventType.taskComplete)
                    logBuffer(event.source, eventTime.concat(' ', tr('Task'), ' ', event.task.id, ' ', tr("completed")))
                else if (app.model.objects[event.source].objClass == app.options.types.objClass.bpGenerator && event.type == app.options.types.eventType.taskNew)
                    logBuffer(event.source, eventTime.concat(' ', tr('Task'), ' ', event.task.id, ' ', tr("created")))
                else if (app.model.objects[event.source].objClass == app.options.types.objClass.bpExecute && event.type == app.options.types.eventType.taskAssigned)
                    logBuffer(event.source, eventTime.concat(' ', tr('Task'), ' ', event.task.id, ' ', tr("assigned")))
                else if (app.model.objects[event.source].objClass == app.options.types.objClass.bpCheckPoint && event.type == app.options.types.eventType.taskFinished)
                    logBuffer(event.source, eventTime.concat(' ', tr('Task'), ' ', event.task.id, ' ', tr("finished")))
                else if (app.model.objects[event.source].objClass == app.options.types.objClass.bpSupport && event.type == app.options.types.eventType.taskSupported)
                    logBuffer(event.source, eventTime.concat(' ', tr('Task'), ' ', event.task.id, ' ', tr("spent resource")));
            }
        },
        init: function() {},
        onProgress: function(event) {
            if (event.progress == 0) {
                store.clear();
            }
        }
    }
}());