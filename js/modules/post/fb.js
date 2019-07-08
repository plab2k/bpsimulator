;
window.app.post.fb = (function() {
	// http://stackoverflow.com/questions/4999024/facebook-graph-api-upload-photo-using-javascript
	var onconnect = function(token, data, caption, callback) {
		app.helper.postImage({
		  fb : {
		    caption : app.helper.utf8encode(caption),
		    accessToken : token,
		    file : {
		      name : 'model.png',
		      type : 'image/png',
		      dataString : atob(data)
		    }
		  },
		  call : {
		    url : 'https://graph.facebook.com/me/photos',
		    success : callback,
		    error : callback
		  }
		});
	};
	var pub = function(callback) {
		app.helper.svg2png(function(data) {
			onconnect(FB.getAuthResponse()['accessToken'], data, '', callback);
		});
	};
	return {
		share : function(callback) {
			var onend = function(result) {
				if (result && result.post_id)
					callback({
						url : '//fb.com/me'
					})
				else
					callback(null)
			};
			$.cachedScript('//connect.facebook.net/en_US/sdk.js').done(function() {
				FB.init({
				  appId : '259898200854745',
				  version : 'v2.4'
				});
				FB.getLoginStatus(function(response) {
					if (response.status === 'connected') {
						pub(onend);
					} else {
						FB.login(function(response) {
							if (response.status === 'connected')
								pub(onend);
							else
								onend()
						}, {
							scope : 'publish_actions'
						});
					}
				});
			});
		}
	}
}());