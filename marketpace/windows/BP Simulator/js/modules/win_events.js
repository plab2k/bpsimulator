;
window.app = window.app || {};
app.events = (function () {
    var ad = function () {
        //
    }
    $("#controlpanel").on("tabsactivate", function (event, ui) {
        if ($("#controlpanel").tabs("option", "active") == 0)
            ad();
    });
    return {
        add: function (category, action, label) {

            console.log(category, action, label);
            ad();
        },
        screen: function (screenName) {

            ad();
        },
        error: function (description, isfatal) {

            console.log("Error", description);
        },
        showad: function () {
            ad();
        }
    }
}());