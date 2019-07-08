;
(function($) {
    $.widget("ui.timeranges", {
        options: {
            countable: false
        },
        templateItem: null,
        _create: function() {
            var that = this;
            this.element.addClass("bptimerange").append(app.helper.loadContent("#timerangeList"));
            if (this.options.countable)
                this.templateItem = app.helper.loadContent("#timerangeListItemCountable");
            else
                this.templateItem = app.helper.loadContent("#timerangeListItem");
            $(this.element).on("click", ".bp-icon-remove", function() {
                that.options.list.splice($("li", that.element).index($(this).parent()), 1)
                $(this).parent().remove();
                that._trigger("changed");
            });
            $("button", this.element).on("click", function() {
                that.apply();
                that.options.list.push({
                    fromSec: 0,
                    toSec: 24 * 60 * 60,
                    count: 24 * 60 * 60,
                    distrType: 1
                });
                that.update();
                that._trigger("changed");
                return false;
            });
            this._super();
        },
        update: function() {
            var item, i, list = this.options.list.sort(function(a, b) {
                return a.fromSec - b.fromSec
            });
            $("ul", this.element).empty();
            for (i = 0; i < list.length; i++) {
                item = this.templateItem.clone();
                $("input[name=tr_from]", item).val(list[i].fromSec / 60 / 60);
                $("input[name=tr_to]", item).val(list[i].toSec / 60 / 60);
                if (this.options.countable) {
                    $("input[name=tr_count]", item).val(list[i].count);
                    $("select[name=tr_distrtype]", item).val(list[i].distrType);
                }

                $("ul", this.element).append(item);
            };
        },
        apply: function() {
            var that = this;
            this.options.list = [];
            $("li", this.element).each(function(i) {
                that.options.list.push({
                    fromSec: $("input[name=tr_from]", this).val() == "" ? 0 : parseInt($("input[name=tr_from]", this).val()) * 60 * 60,
                    toSec: $("input[name=tr_to]", this).val() == "" ? 0 : parseInt($("input[name=tr_to]", this).val()) * 60 * 60
                });
                if (that.options.countable) {
                    that.options.list[i].count = $("input[name=tr_count]", this).val() == "" ? 0 : parseInt($("input[name=tr_count]", this).val());
                    that.options.list[i].distrType = parseInt($("select[name=tr_distrtype]", this).val());
                }


            });
        },
        _destroy: function() {
            this.element.removeClass("bptimerange");
            this._super();
        }
    });
})(jQuery)