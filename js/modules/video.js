;
window.app.video = (function() {
	var adsManager;
	function requestAds() {
		var adDisplayContainer = new google.ima.AdDisplayContainer(document.getElementById('adContainer'));
		adDisplayContainer.initialize();
		var adsLoader = new google.ima.AdsLoader(adDisplayContainer);
		adsLoader.addEventListener(google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED, onAdsManagerLoaded, false);
		adsLoader.addEventListener(google.ima.AdErrorEvent.Type.AD_ERROR, onAdError, false);
		var adsRequest = new google.ima.AdsRequest();
		//adsRequest.adTagUrl = 'http://pubads.g.doubleclick.net/gampad/ads?sz=400x300&' + 'iu=%2F6062%2Fiab_vast_samples&ciu_szs=300x250%2C728x90&gdfp_req=1&' + 'env=vp&output=vast&unviewed_position_start=1&url=' + '[referrer_url]&correlator=[timestamp]&cust_params=iab_vast_samples' + '%3Dlinear';
		adsRequest.adTagUrl = 'https://pubads.g.doubleclick.net/gampad/ads?sz=640x480&iu=/30806496/bpsimulator.app.main&impl=s&gdfp_req=1&env=vp&output=xml_vast2&unviewed_position_start=1&url=[referrer_url]&description_url=[description_url]&correlator=[timestamp]';
		adsLoader.requestAds(adsRequest);
	}
	function onAdsManagerLoaded(adsManagerLoadedEvent) {
		var adsRenderingSettings = new google.ima.AdsRenderingSettings();
		adsRenderingSettings.restoreCustomPlaybackStateOnAdBreakComplete = true;
		var videoContent = document.getElementById('contentElement');
		adsManager = adsManagerLoadedEvent.getAdsManager(videoContent, adsRenderingSettings);
		try {
			adsManager.init(640, 480, google.ima.ViewMode.NORMAL);
			adsManager.start();
		} catch (adError) {
		}
	}
	function onAdError(adErrorEvent) {
		console.log(adErrorEvent.getError());
		adsManager.destroy();
	}
	return {
		init : function() {
			requestAds();
		}
	}
}());

