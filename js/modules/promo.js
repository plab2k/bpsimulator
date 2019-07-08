;
var promo = (function() {
	const
	afterStart = 1000 * 60 * 5, keyName = "utmResult", state = {
	  nopromt : 0,
	  accept : 1,
	  cancel : 2
	}
	function runPromo() {
		var userAgent = navigator.userAgent || navigator.vendor || window.opera;
		if (typeof window.chrome !== 'undefined' && !userAgent.match(/Android/i)) {// ChromeWebStore
			rate("#gws");
		} else if (!!navigator.userAgent.match(/firefox/i))
			rate("#moz");
	};
	function rate(template) {
		/*
		app.snackbar.show("Please rate the App", "Got it", app.options.types.messageType.promo, function() {
			localStorage.setItem(keyName, state.accept);
			app.events.add("rateApp", "Accept");
			window.open(app.helper.loadContent(template).attr("href"), '_blank')
		});
		*/
		if (typeof googletag != 'undefined' && googletag.apiReady){
			googletag.pubads().setTargeting("promo", "true");			
			app.events.add("rateApp", "Promt");
			localStorage.setItem(keyName, state.accept);
		}
		
	};
	if (!localStorage[keyName])
		localStorage.setItem(keyName, state.nopromt)
	else {
		if (localStorage[keyName] != state.accept) {
			window.setTimeout(runPromo, afterStart)
		}
	};
})();
