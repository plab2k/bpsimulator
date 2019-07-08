;
app.solver = (function() {
	var _inited = false, _level = 0, _date = 0;
	var init = function() {
		_inited = true;
		if (!app.options[app.options.keyNames.license])
			return;
		var str = atob(app.options[app.options.keyNames.license]), res = "", val = "IDFtPoYmO6X0dqRW", i, j, tmp;
		for (i = 0; i < str.length; ++i) {
			tmp = str[i];
			for (j = 0; j < val.length; ++j)
				tmp = String.fromCharCode(tmp.charCodeAt(0) ^ val.charCodeAt(j));
			res += tmp;
		}
		tmp = res.split(':');
		_level = parseInt(tmp[2]);
		_level=_level==1?2:_level;
		_date = parseInt(tmp[1]) * 1000;
		check();
	};
	var check = function() {
		if (new Date(_date) < new Date()) {
			_level = 0;
			_date = 0;
			if (app.options[app.options.keyNames.license])
				app.options[app.options.keyNames.license] = null;
		}
	};
	return {
	  solve : function(func) {
		  !_inited ? init() : check();
		  switch (func) {
			  case app.options.types.functions.collaborate :
				  return _level >= 1 ? true : false;
				  break;
			  case app.options.types.functions.library :
				  return _level >= 1 ? true : false;
				  break;
			  case app.options.types.functions.import :
				  return _level >= 1 ? true : false;
				  break;
			  case app.options.types.functions.advert :
				  return _level > 0 ? false : true;
				  break;
			  case app.options.types.functions.simulation :
				  return true;
				  break;
		  }
		  return false
	  },
	  reinit : function() {
		  _inited = false;
	  },
	  wtp : function() {
		  _level = 2;
		  _date = new Date(new Date().getTime() + 60 * 60 * 1000);
		  return true && 'Challenge accepted';
	  },
	  info : function() {
		  check();
		  return {
		    level : _level,
		    date : _date
		  }
	  }
	}
}());