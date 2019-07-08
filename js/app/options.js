;
window.app = window.app || {};
app.options = (function() {
    var _types = {
        logic: {
            AND: 0,
            XOR: 1
        },
        timing: {
            FIXED: 0,
            RANDOM: 1
        },
        storage: {
            local: {
                name: "local",
                value: "File Storage"
            },
            googleDrive: {
                name: "googleDrive",
                value: "Google Drive"
            },
            dropbox: {
                name: "dropbox",
                value: "Dropbox"
            },
            yandexDisk: {
                name: "yandexDisk",
                value: "Yandex.Disk"
            },
            oneDrive: {
                name: "oneDrive",
                value: "OneDrive"
            }
        },
        lang: {
            en: {
                culture: "en",
                name: "English"
            },
            ru: {
                culture: "ru",
                name: "Русский"
            },
            es: {
                culture: "es",
                name: "Español"
            },
            fr: {
                culture: "fr",
                name: "Française"
            }
        },
        execResource: {
            ALTERNATE: 0,
            JOINTLY: 1
        },
        timeMult: {
            second: 1,
            minute: 60,
            hour: 60 * 60,
            day: 60 * 60 * 24
        },
        objClass: {
            bpFunction: "bpFunction",
            bpGenerator: "bpGenerator",
            bpCheckPoint: "bpCheckPoint",
            bpEvent: "bpEvent",
            bpInOut: "bpInOut",
            bpRegulate: "bpRegulate",
            bpExecute: "bpExecute",
            bpSupport: "bpSupport",
            bpComment: "bpComment",
            bpProcedure: "bpProcedure"
        },
        objType: {
            bpObject: "bpObject",
            bpSubject: "bpSubject"
        },
        objResFields: ["input", "output", "regulate", "execute", "support"],
        eventType: {
            taskNew: 0,
            taskComplete: 1,
            taskDelivered: 2,
            taskAssigned: 3,
            taskWaitQueue: 4,
            taskFinished: 5,
            taskCostSpent: 6,
            taskOperation: 7,
            taskSupported: 8
        },
        messageType: {
            critical: 0,
            info: 1,
            promo: 2
        },
        nameType: {
            create: 0,
            copy: 1,
            clone: 2
        },
        functions: {
            collaborate: 0,
            library: 1,
            import: 2,
            advert: 3,
            simulation: 4,
            trial: 5,
            advdesign: 6
        },
        distrType: {
            period: 0,
            uniformly: 1,
            normal: 2,
            expfade: 3,
            exprise: 4,
            linfade: 5,
            linrise: 6
        }
    };
    var _settings = {};
    _settings.UI = {
        language: _types.lang.en.culture,
        snapToGrid: true,
        gridShow: false,
        gridSize: 20,
        objectWidth: 160,
        objectBW: false,
        enableEpc: false,
        isShowLog: true,
        logBufferLength: 2
    };
    _settings.General = {
        storage: _types.storage.googleDrive.name,
        autoOpen: true,
        autoSave: false,
        welcomeScreen: false,
        isLogging: false
    };
    _settings.Simulation = {
        simstartSeconds: 60 * 60 * 9,
        simdurationVal: 24,
        simdurationMult: 3600,
        isLogging: true
    };
    _settings.Library = {
        fileId: "",
        fileName: "",
        updateModel: false,
        updateLibrary: true
    };
    _settings.session = {
        lastsavedmodel: null,
        selfPromoSate: null,
        historyArray: [],
        currentFile: null
    };
    var _userInfo = {
        authorized: false,
        name: null,
        email: null,
        id: null
    };
    var bElem = {
            id: null,
            name: null,
            position: {
                top: 0,
                left: 0
            }
        },
        bObj = {
            objType: _types.objType.bpObject,
            prior: {
                objects: [],
                execLogic: _types.logic.XOR
            },
            next: {
                objects: [],
                allocLogic: _types.logic.AND
            },
            _simulation: {
                passedCount: 0
            }
        },
        bSubj = {
            objType: _types.objType.bpSubject
        },
        bFunc = {
            name: "Function",
            objClass: _types.objClass.bpFunction,
            input: {
                objects: []
            },
            output: {
                objects: []
            },
            regulate: {
                objects: []
            },
            execute: {
                objects: [],
                execResource: _types.execResource.ALTERNATE
            },
            support: {
                objects: []
            },
            runTimeMin: 1,
            runTimeMax: 1,
            runTimeMult: _types.timeMult.minute,
            batchSize: 1,
            batchFill: false
        },
        bGen = {
            name: "Task Generator",
            objClass: _types.objClass.bpGenerator,
            timeRanges: [{
                fromSec: 0,
                toSec: 60 * 60 * 24,
                count: 60 * 24,
                distrType: _types.distrType.uniformly
            }],
            allocation: _types.timing.FIXED,
            globalPriority: 0,
            batchSize: 1
        },
        bCheck = {
            name: "Check Point",
            objClass: _types.objClass.bpCheckPoint,
            allowFilter: []
        },
        bEvent = {
            name: "Event",
            objClass: _types.objClass.bpEvent
        },
        bInOut = {
            name: "Input/Output",
            objClass: _types.objClass.bpInOut
        },
        bReg = {
            name: "Regulator",
            objClass: _types.objClass.bpRegulate
        },
        bExec = {
            name: "Executer",
            objClass: _types.objClass.bpExecute,
            count: 1,
            costValue: 0,
            costPeriod: 60 * 60,
            timeRanges: [{
                fromSec: 0,
                toSec: 60 * 60 * 24
            }]
        },
        bSup = {
            name: "Resource",
            objClass: _types.objClass.bpSupport,
            count: 1,
            costValue: 0,
            costPeriod: 60 * 60
        },
        bComm = {
            name: "Comment",
            objClass: _types.objClass.bpComment
        },
        bProc = {
            name: "Procedure",
            objClass: _types.objClass.bpProcedure
        },
        model = {
            info: {
                id: app.helper.generateId(),
                name: null,
                description: null,
                created: null,
                lastSaved: null,
                revision: 0,
                coreVersion: null,
                filename: null
            },
            objects: {}
        };
    var _construct = function(objClass) {
        switch (objClass) {
            case _types.objClass.bpFunction:
                return $.extend(true, {}, bElem, bObj, bFunc);
            case _types.objClass.bpGenerator:
                return $.extend(true, {}, bElem, bObj, bGen);
            case _types.objClass.bpEvent:
                return $.extend(true, {}, bElem, bObj, bEvent);
            case _types.objClass.bpCheckPoint:
                return $.extend(true, {}, bElem, bObj, bCheck);
            case _types.objClass.bpExecute:
                return $.extend(true, {}, bElem, bSubj, bExec);
            case _types.objClass.bpRegulate:
                return $.extend(true, {}, bElem, bSubj, bReg);
            case _types.objClass.bpInOut:
                return $.extend(true, {}, bElem, bSubj, bInOut);
            case _types.objClass.bpSupport:
                return $.extend(true, {}, bElem, bSubj, bSup);
            case _types.objClass.bpComment:
                return $.extend(true, {}, bElem, bSubj, bComm);
            case _types.objClass.bpProcedure:
                return $.extend(true, {}, bElem, bObj, bProc);
            default:
                throw new Error("ObjClass not found")
        }
    };
    var _states = {
        stockLength: {
            name: "In the processing queue",
            icon: "assignment-late",
            value: app.states.stockLength
        },
        workLength: {
            name: "Tasks in the work",
            icon: "assignment-account",
            value: app.states.workLength
        },
        passedCount: {
            name: "Tasks executed",
            icon: "assignment-turnedin",
            value: app.states.passedCount
        },
        utilisationRate: {
            name: "Utilisation Percent",
            icon: "persons",
            value: app.states.utilisationRate
        },
        emplCount: {
            name: "Number of employees",
            icon: "persons",
            value: app.states.emplCount
        },
        emplSum: {
            name: "Total performers",
            icon: "persons",
            value: app.states.emplSum
        },
        durationTime: {
            name: "Duration",
            icon: "timelapse",
            value: app.states.durationTime
        },
        instanceProbability: {
            name: "Probability",
            icon: "probability",
            value: app.states.instanceProbability
        },
        execCost: {
            name: "Сost per hour",
            icon: "coin",
            value: app.states.execCost
        },
        execCostAvg: {
            name: "Weighted average cost",
            icon: "coin",
            value: app.states.execCostAvg
        },
        execCostFunc: {
            name: "Execution cost",
            icon: "coin",
            value: app.states.execCostFunc
        },
        instanceCostFunc: {
            name: "Instance cost",
            icon: "factory",
            value: app.states.instanceCostFunc
        },
        instanceCostSum: {
            name: "Amount of costs",
            icon: "factory",
            value: app.states.instanceCostSum
        },
        execTimeSum: {
            name: "Employment time",
            icon: "timelapse",
            value: app.states.execTimeSum
        },
        execCostSum: {
            name: "Employment cost",
            icon: "factory",
            value: app.states.execCostSum
        },
        execUtilisation: {
            name: "Utilisation ratio",
            icon: "persons",
            value: app.states.execUtilisation
        },
        transLength: {
            name: "Tasks in the delivery",
            icon: "arrow-down",
            value: app.states.transLength
        },
        suppExecCount: {
            name: "Tasks executed",
            icon: "assignment-turnedin",
            value: app.states.suppExecCount
        },
        avgTaskCost: {
            name: "Total Costs",
            icon: "coin",
            value: app.states.avgTaskCost
        },
        sumTaskCost: {
            name: "Total Costs",
            icon: "factory",
            value: app.states.sumTaskCost
        },
        avgTaskTime: {
            name: "The average time from the start",
            icon: "timelapse",
            value: app.states.avgTaskTime
        }
    };
    var _objectStates = {
        bpFunction: [_states.transLength, _states.stockLength, _states.workLength, _states.passedCount],
        bpGenerator: [_states.passedCount],
        bpCheckPoint: [_states.avgTaskTime, _states.sumTaskCost],
        bpExecute: [_states.execUtilisation],
        bpSupport: [_states.suppExecCount]
    };
    var _keyNames = {
        userinfo: "bpsuser",
        license: "license",
        settings: "appSettings",
        log: "log",
        stepcount: "steps",
        logTaskName: "task"
    };
    var _subplan = {
        0: {
            name: "Free"
        },
        1: {
            name: "Plus"
        },
        2: {
            name: "Pro"
        }
    };
    return {
        coreVersion: "2.0.1",
        appVersion: null,
        settings: _settings,
        types: _types,
        objectStates: _objectStates,
        objectStatesItem: _states,
        userinfo: _userInfo,
        keyNames: _keyNames,
        subPlan: _subplan,
        historylength: 5,
        advertInterval: 1000 * 45,
        connectRadius: 3,
        currentFile: null,
        db: null,
        load: function() {
            var loaded = false;
            Globalize.addCultureInfo("ru", {
                nativeName: "Русский"
            });
            app.options.appVersion = $('meta[itemprop=softwareVersion]').attr("content");
            app.options.settings.General.isLogging = ('indexedDB' in window);
            var obj = app.storage.local.loadSettings();
            if (obj) {
                $.extend(true, app.options.settings, obj);
                loaded = true;
            }
            Globalize.culture(app.options.settings.UI.language);
            return loaded;
        },
        save: function() {
            app.storage.local.saveSettings(app.options.settings);
        },
        newObject: function(objClass) {
            return _construct(objClass)
        },
        newModel: function() {
            return $.extend(true, {}, model)
        }
    }
}());