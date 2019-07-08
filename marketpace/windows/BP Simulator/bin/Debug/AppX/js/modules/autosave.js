;
var autosave = (function() {
	const
	autosaveTime = 1000 * 60 * 5;
	function checkForSave() {
		if (app.options.settings.General.autoSave == true && $.isEmptyObject(app.model)===false && app.core.isChanged === true)
			api.model.save();
	};
	window.setInterval(checkForSave, autosaveTime);
})();
