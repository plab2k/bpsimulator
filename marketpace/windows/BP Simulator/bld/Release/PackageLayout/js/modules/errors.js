;
(function() {
	window.onerror = function(msg, source, line) {
		'use strict';
		if (app && app.events)
			app.events.error([line, msg].join(':'),true);
		if (app && app.control)
			app.control.onError(msg);
	};
}());