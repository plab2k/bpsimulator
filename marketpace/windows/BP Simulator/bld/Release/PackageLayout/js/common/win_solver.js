;
app.solver = (function () {
    var _level = 0, _date = 0;
    // Register for the license state change event.
    BuildInfo.currentApp.licenseInformation.addEventListener("licensechanged", reloadLicense);
    reloadLicense();
    function reloadLicense() {
        var licenseInformation = BuildInfo.currentApp.licenseInformation;
        if (licenseInformation.isActive) {
            if (licenseInformation.isTrial) {
                app.options.userinfo.authorized = true;
                _level = 2;
                _date = new Date(licenseInformation.expirationDate);
            }
            else {
                _date = 0;
                _level = 1;
                $("#buybtn").unbind().remove();
                $(".inactived").removeClass("inactived");
                app.options.userinfo.authorized = false;
            }
        }
        else {
            // A license is inactive only when there's an error.
        }
    };
    return {
        solve: function (func) {
            switch (func) {
                case app.options.types.functions.simulation:
                    return BuildInfo.currentApp.licenseInformation.isActive;
                    break;
                case app.options.types.functions.trial:
                    return BuildInfo.currentApp.licenseInformation.isTrial;
                    break;
                default:
                    return true;
            }
        },
        wtp: function () {
            _level = 2;
            _date = new Date(new Date().getTime() + 60 * 60 * 1000);
            return true && 'Challenge accepted';
        },
        info: function () {
            return {
                level: _level,
                date: _date
            }
        },
        buybtnclick: function () {
            BuildInfo.currentApp.requestAppPurchaseAsync(false).done(function complete(result) {
                //
            }, function error(error) {
                app.events.error("name: Buy result\nmessage: " + error, true);
                app.snackbar.show(error, "Retry", app.options.types.messageType.critical, app.solver.buybtnclick)
            });
            return false;
        }
    }
}());