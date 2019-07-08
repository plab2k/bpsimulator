;
(function() {
	var afterStart = 1000 * 60 * 5;
	$(document).ready(function() {
		$("body").append('<script type="text/javascript">!function(){window.kivo=window.kivo||{},kivo.minimized=!1,kivo.enableAnnotations=function(a){kivo.enabled=!0,kivo.enabledOptions=a},kivo.minimize=function(a){kivo.minimized=a},window.kivoApiKey="null";var a=document.createElement("script");a.type="text/javascript",a.src="https://talktousers.com/kivo-talk/dist/browserify.js",document.getElementsByTagName("head")[0].appendChild(a)}();</script>');
		window.setTimeout(talk, afterStart);
	});
	function talk() {
		if (kivo && app)
			kivo.enableAnnotations({
			  minimized : true,
			  questions : {
			    initial : app.helper.trans("Show us how you would improve this app?"),
			    directions : app.helper.trans("Click on the parts of the app you'd like to improve to leave comments.")
			  },
			  email : app.options.userinfo.authorized == true ? app.options.userinfo.email : ""
			});
	}
}());