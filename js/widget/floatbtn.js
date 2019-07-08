;
(function($) {
    $.widget("ui.floatbtn", {
        _create: function() {
            var that = this;
            $("a", this.element).on("click", function() {
                $(this).toggleClass("play pause");
                that._trigger("click", null, $(this).hasClass("pause") ? "play" : "pause");
                //app.events.add("floatPushed", $(this).hasClass("pause") ? "play" : "pause");
                return false;
            });
            this.element.show();
            $(document).on("onSimulationStop", function() {
                that.action("stop")
            });
            this._super();
        },
        _destroy: function() {
            $("a", this.element).off();
            this._super();
        },
        action: function(action) {
            switch (action) {
                case "pause":
                case "stop":
                case "next":
                    $("a", this.element).removeClass("pause").addClass("play");
                    break;
                default:
                    $("a", this.element).removeClass("play").addClass("pause");
                    break;
            }
        }
    });
})(jQuery)