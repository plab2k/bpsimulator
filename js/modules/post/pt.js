;
window.app.post.pt = (function() {
	var token = null, boardId = null, cbfunc;
	var post = function() {
		app.helper.svg2png(function(data) {
			var options = {
			  board : boardId, // boardId
			  note : app.model.info.name,
			  link : 'https://www.bpsimulator.com', // where the pin is from
			  image_base64 : 'data:image/png;base64,' + data
			}
			$.post('https://api.pinterest.com/v1/pins/?access_token='.concat(token), options).done(function(result) {
				cbfunc({
					url : result.data.url
				});
			});
		})
	};
	var login = function(callback) {
		PDK.login({
			scope : 'read_public, write_public'
		}, function(session) {
			if (session && session.session && session.session.accessToken) {
				token = session.session.accessToken;
				callback();
			} else
				cbfunc(null);
		});
	};
	var getboard = function() {
		var boardname = "My Models", boarddescription = app.helper.trans("Business process models");
		PDK.request('/v1/me/search/boards/', 'GET', {
			query : boardname
		}, function(response) {
			if (response && response.data) {
				if (response.data.length == 0) {
					PDK.request('/boards/', 'POST', {
					  name : boardname,
					  description : boarddescription
					}, function(response) {
						boardId = response.data.id;
						post();
					});
				} else {
					boardId = response.data[0].id;
					post();
				}
			} else
				cbfunc(response);
		});
	};
	return {
		share : function(callback) {
			cbfunc = callback;
			$.cachedScript('//assets.pinterest.com/sdk/sdk.js').done(function() {
				PDK.init({
				  appId : "4792776214410434545",
				  cookie : true
				});
				if (!token)
					login(function() {
						getboard();
					})
				else
					getboard();
			});
		}
	}
}());