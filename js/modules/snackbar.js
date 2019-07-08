;
window.app.snackbar = (function() {
    "use strict";
    var close = function(callback) {
        $("#snackbar a").off();
        if ($("#snackbar").length == 1)
            $("#snackbar").slideToggle("fast", function() {
                $(this).remove();
                if (callback)
                    callback();
            });
        else if (callback)
            callback();
        clearTimeout(to);
    };
    var to = -1;
    return {
        show: function(text, action, type, doCallback) {
            var a = action ? $("<a></a>").attr("href", "#").text(app.helper.trans(action)).on("click", function() {
                doCallback();
                close();
                return false;
            }) : "";
            close(function() {
                var sn = $("<div id='snackbar' class='ms" + type + "'></div>").text(app.helper.trans(text)).append(a).css("display", "none").appendTo("body");
                sn.css("left", parseInt((document.documentElement["clientWidth"] - sn.width()) / 2)).slideToggle("fast");
            });
            to = setTimeout(close, (type == app.options.types.messageType.promo) ? 1000 * 60 * 60 : 1000 * 30);
        }
    }
}());