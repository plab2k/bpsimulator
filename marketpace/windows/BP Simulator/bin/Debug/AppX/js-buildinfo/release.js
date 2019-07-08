(function () {
    "use strict";
    WinJS.Namespace.define("BuildInfo", {
        isDebugBuild: false,
        isReleaseBuild: true,
        config: "Release",
        currentApp: Windows.ApplicationModel.Store.CurrentApp
     });
})();