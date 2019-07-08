(function () {
    "use strict";
 
    WinJS.Namespace.define("BuildInfo", {
        isDebugBuild: true,
        isReleaseBuild: false,
        config: "Debug",
        currentApp: Windows.ApplicationModel.Store.CurrentAppSimulator
    });
})();