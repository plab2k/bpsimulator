;
(function($) {
	$.ajaxSetup({
		timeout : 4000
	});
	jQuery.cachedScript = function(url, options) {
		options = $.extend(options || {}, {
		  dataType : "script",
		  cache : true,
		  url : url
		});
		return jQuery.ajax(options);
	};
	String.prototype.toHHMMSS = function() {
		var sec_num = parseInt(this, 10); // don't forget the second param
		var hours = Math.floor(sec_num / 3600);
		var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
		var seconds = sec_num - (hours * 3600) - (minutes * 60);
		if (hours < 10) {
			hours = "0" + hours;
		}
		if (minutes < 10) {
			minutes = "0" + minutes;
		}
		if (seconds < 10) {
			seconds = "0" + seconds;
		}
		var time = hours + ':' + minutes + ':' + seconds;
		return time;
	};
	$.widget("ui.draggable", $.extend({}, $.ui.draggable.prototype, {
		_normalizeRightBottom : function() {
			// this is bug with compute css propery 'auto' that will set the 'width' propery of a helper
		}
	}));
})(jQuery);