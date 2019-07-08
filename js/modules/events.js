;
window.app = window.app || {};
app.events = (function() {
    "use strict";
    var ad = function() {
        if (window.googletag && $("#controlpanel").tabs("option", "active") == 0 && (typeof app.control.lastad == 'undefined' || (new Date()).getTime() - app.control.lastad > app.options.advertInterval)) {
            if (googletag.apiReady && $('#div-gpt-ad-1436956489175-0:visible').length == 1) {
                googletag.pubads().setTargeting("lang", app.options.settings.UI.language);
                googletag.pubads().refresh();
                app.control.lastad = (new Date()).getTime();
            } else if (typeof app.control.lastad == 'undefined') {
                app.snackbar.show("Please disable AdBlock");
                app.control.lastad = (new Date()).getTime();
                app.events.add("Advert", "Blocked");
            }
        };
    };
    $("#controlpanel").on("tabsactivate", function(event, ui) {
        if ($("#controlpanel").tabs("option", "active") == 0)
            ad();
    });
    return {
        add: function(category, action, label, showad) {
            const advert = typeof(showad) == 'undefined' ? true : showad;
            if (typeof ga !== 'undefined') {
                ga("send", {
                    hitType: "event",
                    eventCategory: category,
                    eventAction: action,
                    eventLabel: label ? label : null
                });
            }
            /* else
			  console.log(category, action, label ? label : null); */
            if (advert) ad();
        },
        screen: function(screenName) {
            this.add("appState", "screen", screenName);
        },
        error: function(description, isfatal) {
            if (typeof ga !== 'undefined')
                ga('send', 'exception', {
                    'exDescription': '(' + app.options.appVersion + ')' + description,
                    'exFatal': isfatal
                });
            else
                console.log("Error", description);
        },
        showad: function() {
            ad();
        },
        titleChanged: function() {
            document.title = app.model.info.name;
            typeof ga !== 'undefined' ? ga('set', 'title', document.title) : null;
        }
    }
}());