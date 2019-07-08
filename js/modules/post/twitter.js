;
window.app.post.tw = (function() {
	return {
		share : function(callback) {
			$.cachedScript('https://www.bpsimulator.com/js/vendor/oauth.min.js').done(function() {
				OAuth.initialize('bl-lO5YoitcdNS2iUpBI40KAzS4')
				OAuth.popup('twitter').done(function(oauthresult) {
					app.helper.svg2png(function(data) {
						oauthresult.post('https://upload.twitter.com/1.1/media/upload.json', {
							data : {
								media_data : data
							}
						}).done(function(data) {
							oauthresult.post('https://api.twitter.com/1.1/statuses/update.json', {
								data : {
								  status : app.helper.trans("Business process model").concat(" \"", app.model.info.name, "\" bpsimulator.com"),
								  media_ids : data.media_id_string
								}
							}).done(function(res) {
								callback({
									url : 'https://twitter.com/me/status/' + res.id_str
								})
							}).fail(function(err) {
								callback()
							})
						}).fail(function(err) {
							callback()
						});
					});
				}).fail(function(err) {
					callback()
				})
			});
		}
	}
}());