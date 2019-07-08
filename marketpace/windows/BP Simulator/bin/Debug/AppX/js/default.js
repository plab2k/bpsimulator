// Основные сведения о пустом шаблоне см. в следующей документации:
// http://go.microsoft.com/fwlink/?LinkId=232509
(function () {
    "use strict";
    var winapp = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;
        
    $(document).ready(function () {
        var lng = Windows.System.UserProfile.GlobalizationPreferences.languages[0];
        if ($.inArray(lng, $.map(app.options.types.lang, function (val) {
			  return val.culture
        })) != -1)
            app.control.init(lng);
        else
            app.control.init('en');

        winapp.onactivated = function (args) {
            if (args.detail.kind === activation.ActivationKind.launch) {
                if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
                    app.control.openDemo(function () {
                        app.helper.expandAll($("#control"));
                        app.control.showDialog("#help");
                        //$("#controlpanel").ctrlpanel("showPanel", 2);
                    });

                } else {
                    api.model.getSnapshot();
                }

            } else if (args.detail.kind === activation.ActivationKind.file) {
                app.storage.local.load(args.detail.files[0], function (content, fileid) {
                    $("main").modeler("clear");
                    api.model.open(content);
                    api.model.setSnapshot(true);
                    if (fileid) {
                        app.helper.lastOpenedmodel(fileid)
                        app.model.info.name = args.detail.files[0].displayName;
                        Windows.UI.ViewManagement.ApplicationView.getForCurrentView().title = app.model.info.name;
                        app.events.add("userAction", "modelAction", "openAssociated");
                    }
                });
            }
            args.setPromise(WinJS.UI.processAll());
        };
        winapp.oncheckpoint = function (args) {
            api.model.setSnapshot();
            app.options.save();
        };
        winapp.start();
    });

})();
