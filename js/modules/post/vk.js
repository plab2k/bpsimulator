;
window.app.post.vk = (function() {
	var pub = function(uid, message, callback) {
		VK.Api.call('photos.getWallUploadServer', {
			group_id : uid
		}, function(r) {
			if (r.response) {
				app.helper.svg2png(function(data) {
					$.post('https://www.bpsimulator.com/api/v1/pub/vk', {
					  url : r.response.upload_url,
					  data : data
					}, function(res) {
						var p = JSON.parse(res);
						VK.Api.call('photos.saveWallPhoto', {
						  user_id : uid,
						  group_id : uid,
						  photo : p.photo,
						  server : p.server,
						  hash : p.hash
						}, function(s) {
							if (s.response) {
								var url = 'https://vk.com/' + s.response[0].id;
								VK.Api.call('wall.post', {
								  message : message,
								  attachments : s.response[0].id + ',https://www.bpsimulator.com'
								}, function(r) {
									if (r.response)
										callback(url);
									else
										callback(null)
								});
							} else
								callback(null)
						});
					})
				});
			} else
				callback(null)
		});
	};
	var post = function(uid, callback) {
		pub(uid, app.helper.trans("Business process model").concat(" \"", app.model.info.name, "\""), function(res) {
			if (res)
				callback({
					url : res
				})
			else
				callback()
		});
	}
	var check = function() {
		VK.Api.call('account.getAppPermissions', {}, function(res) {
			if (res == 4)
				return true;
			else
				return false
		})
	};
	return {
		share : function(callback) {
			$.cachedScript('//vk.com/js/api/openapi.js').done(function() {
				VK.init({
					apiId : 4376514
				});
				VK.Auth.login(function(response) {
					if (response.session)
						post(response.session.mid, callback);
					else
						callback(response && response.error ? response.error : null);
				}, 4);
			});
		}
	}
}());