;
window.app = window.app || {};
window.app.storage = window.app.storage || {};
app.storage.dropbox = (function() {
	var client = null, idxtbl;
	const
	INDEX_NAME = "index";
	function saverec(id, data) {
		var res = idxtbl.query({
			filename : id
		});
		if (res.length > 0)
			res[0].set('content', data);
		else
			idxtbl.insert({
			  filename : id,
			  content : data
			});
	};
	function loadrec(id) {
		var results = idxtbl.query({
			filename : id
		});
		return results.length > 0 ? results[0].get('content') : null;
	};
	function deleterec(id) {
		var results = idxtbl.query({
			filename : id
		});
		if (results.length > 0)
			results[0].deleteRecord();
	};
	return {
	  init : function() {
		  if (client === null)
			  $.cachedScript("https://www.dropbox.com/static/api/dropbox-datastores-1.2-latest.js").done(function() {
				  client = new Dropbox.Client({
					  key : 'yi7w5md3096rd8z'
				  });
				  client.authenticate({
					  interactive : false
				  }, function(error) {
					  if (error) {
						  app.snackbar.show("Authentication error", null, 1000 * 60, null);
						  throw new Error('Authentication error: ' + error);
						  app.storage.initUnComplete();
					  }
				  });
				  if (client.isAuthenticated()) {
					  var datastoreManager = client.getDatastoreManager();
					  datastoreManager.openDefaultDatastore(function(error, datastore) {
						  if (error) {
							  app.snackbar.show("Authentication error", null, 1000 * 60, null);
							  throw new Error('Error opening default datastore: ' + error);
							  app.storage.initUnComplete();
						  } else {
							  idxtbl = datastore.getTable(INDEX_NAME);
							  app.storage.initComplete();
						  }
					  });
				  } else
					  client.authenticate();
			  });
	  },
	  saveModel : function(id, data, callback) {
		  saverec(id, data);
		  callback();
	  },
	  loadModel : function(id, callback) {
		  callback(loadrec(id));
	  },
	  removeModel : function(id, callback) {
		  callback(deleterec(id));
	  },
	  saveIndex : function(callback) {
		  saverec(INDEX_NAME, JSON.stringify(app.storage.index));
		  callback();
	  },
	  loadIndex : function(callback) {
		  var res = loadrec(INDEX_NAME);
		  callback(res ? JSON.parse(res) : null);
	  },
	  getall : function(callback) {
		  var res = idxtbl.query();
		  callback($.map(res, function(val) {
			  return val.get('filename') == INDEX_NAME ? null : val.get('content')
		  }))
	  }
	}
}());
