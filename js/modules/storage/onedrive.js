;
'use strict';
app.storage.oneDrive = (function() {
	var dummyAuthPage = 'msauth.html';
	var redirectUri = window.location.href.replace('index.html', '') + dummyAuthPage;
	var access_token;
	
	var init = function() {
		return new Promise(function(resolve, reject) {
			if (typeof WL == 'undefined') {				
				app.snackbar.show("AdBlock disabling is required", null, app.options.types.messageType.info, null);
				$.cachedScript('https://js.live.net/v5.0/wl.js').done(function() {
					WL.init({
					  client_id : '000000004C15F211',
					  redirect_uri : window.location.href.replace('index.html', '') + dummyAuthPage,
					  response_type : "token"
					});
					WL.login({
						scope : ["wl.signin, wl.basic, wl.skydrive_update, wl.contacts_skydrive"]
					// wl.contacts_skydrive
					}).then(function(response) {
						access_token = response.session.access_token;						
					});
					resolve();
				})
			} else
				resolve();
		})
	};
	function getURL(fileId) {
		return new Promise(function(resolve, reject) {
			var getPath = function() {
				WL.fileDialog({
					mode : "save"
				}).then(function(response) {
					resolve({
					  url : 'https://apis.live.net/v5.0/' + response.data.folders[0].id + '/files/',
					  fileexist : false
					})
				}, reject)
			}
			if (fileId) {
				WL.api({
				  path : fileId,
				  method : "GET"
				}).then(function(response) {
					resolve({
					  url : 'https://apis.live.net/v5.0/' + fileId + '/content',
					  fileexist : true
					})
				}, getPath);
			} else
				getPath()
		});
	};
	function put(obj) {
		return new Promise(function(resolve, reject) {
			var req = new XMLHttpRequest();
			req.open('PUT', obj.url + (obj.fileexist === true ? '' : obj.filename) + '?access_token=' + access_token + (obj.fileexist === true ? '' : '&overwrite=ChooseNewName'));
			req.onload = function() {
				if (req.status == 200 || req.status == 201) {
					resolve(JSON.parse(req.response));
				} else {
					reject(Error(req.statusText));
				}
			};
			req.onerror = function() {
				reject(Error("Network Error"));
			};
			req.send(new Blob([obj.content]));
		});
	};
	function  saveFile(data, callback) {
  	init().then(function(){
  		return getURL(data.sourceId);
  		}).then(
  			function(result) {
  			  return new Promise(function(resolve, error) {
  				  resolve(put($.extend(result, {
  				    filename : data.name + '.' + data.extention,
  				    content : data.content
  				  })))
  			  })
  		  }
  	).then(function(result) {			 
			  WL.api({				  	
			    path : 'https://apis.live.net/v5.0/' + result.id,
			    method : "PUT",
			    body : {
			      name : data.name + '.' + data.extention,
			      description : app.helper.trans("Business process model").concat(' @bpsimulator.com')
			    }
			  });
		  callback({
			  fileid : result.id
		  });			  
	  }).catch(function(result){
	  	callback(result && result.error && result.error.code=='user_canceled'?null: result)
	  });
  };
	return {
	  save : function(data, callback) {
		  var sourceFile;
		  if (app.options.settings.session.currentFile && app.options.settings.session.currentFile.storage == app.options.types.storage.oneDrive.name && app.options.settings.session.currentFile.file)
			  sourceFile = app.options.settings.session.currentFile.file;
		  saveFile($.extend(data, sourceFile ? {
			  sourceFile : sourceFile
		  } : {}), callback);
	  },
	  load : function(fileinfo, callback) {
		  init().then(function() {
			  $.get({
			    url : fileinfo.link + '?access_token=' + access_token,
			    dataType : "text"
			  }).then(function(response) {
				  callback(response)
			  });
		  })
	  },
	  opendialog : function(filetypes, callback) {
		  var pickerOptions = {
		    success : function(files) {
			    callback($.extend(files.values[0], {
				    id : files.values[0].link
			    }));
		    },
		    cancel : function() {
			    callback(null);
		    },
		    linkType : "downloadLink",
		    multiSelect : false,
		    openInNewWindow : false
		  };
		  init().then(function(data) {
			  OneDrive.open(pickerOptions);
		  })
	  },
	  loadById : function(id, callback) {
		  this.load({
			  link : id
		  }, callback)
	  },
	  saveLibrary : function(data, callback) {
	  	data.name=(data.name?data.name:app.helper.trans('Object library'))
		  saveFile(data, callback);
	  },
	  loadLibrary : function(data, callback) {
		  var that = this;
		  init().then(function() {
			  return new Promise(function(resolve, reject) {
				  if (data.fileId && data.fileId.indexOf("file.") == 0) {
					  WL.api({
					    path : data.fileId,
					    method : "GET"
					  }).then(function(response) {
						  resolve(response.upload_location)
					  })
				  } else
					  resolve(data.fileId)
			  })
		  }).then(function(response) {
			  that.load({
				  link : response
			  }, callback)
		  })
	  }
	}
}());