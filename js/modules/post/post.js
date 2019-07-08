;
window.app.post = (function() {
	return {
		post : function(social, callback) {
			if (app.helper.exportImgCapability()) {
				app.events.add("postSocial", social, "Start");
				app.control.startLoading();
				app.post[social].share(function(result) {
					if (result)
						app.snackbar.show("Model published", "Show", app.options.types.messageType.info, function() {
							window.open(result.url, '_blank');
						});
					else
						app.snackbar.show("Publications error", null, app.options.types.messageType.critical);
					app.control.endLoading();
					app.events.add("postSocial", social, result && !result.error ? "Done" : result && result.error ? result.error : "Fail");
					callback();
				});
			} else {
				app.events.add("postSocial", social, "Unsupported");
				app.snackbar.show("Feature unsupported by browser", null, app.options.types.messageType.critical, null);
			}
		}
	}
}());