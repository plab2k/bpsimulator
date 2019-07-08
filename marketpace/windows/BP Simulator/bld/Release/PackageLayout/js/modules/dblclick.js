;
window.app.advert = (function() {
	return {
		init : function() {
	/*
			googletag.cmd.push(function() {
				googletag.defineSlot('/30806496/bpsimulator.app.main', [336, 280], 'div-gpt-ad-1436954130976-0').addService(googletag.pubads());
				googletag.pubads().enableSingleRequest();
				googletag.enableServices();
			});
	*/		
			var content = app.helper.loadContent("#ad");
			
			$("#controlpanel").ctrlpanel("addTab", content, null);
			
			return googletag.pubads().refresh();
		}
	}
}());