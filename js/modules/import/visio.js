;
app.import = app.import || {};
app.import.visio = (function() {
	function onerror(message) {
		console.log(message)
	}
	function gettype(element, fillstyle) {		
		switch (element) {
			case 'Event' :
			case 'Событие' :	
				return app.options.types.objClass.bpEvent
			case 'Function' :
			case 'Функция' :	
				return app.options.types.objClass.bpFunction
			case 'Organizational unit' :
			case 'Подразделение' :				
				return app.options.types.objClass.bpExecute
			case 'Information/ Material' :
			case 'Информация/ Материал' :	
				return app.options.types.objClass.bpSupport
			case 'Main process' :
			case 'Process path' :
			case 'Component' :
			case 'Enterprise area' :
			case 'Process group' :
				return app.options.types.objClass.bpProcedure
			default :
				return null
		}
	}
	function create(item) {
		return api.model.items.import(item.objClass, item);
	};
	function parse(xml, model) {
		var obj, top = $('Cell[N=PinY]', xml).map(function() {
			return parseFloat($(this).attr('V'))
		}).sort(function(a, b) {
			return b - a
		})[0];
		//console.log(xml);
		$('Shape[Name]', xml).each(function() {
			$('Shape[Master=' + $(this).attr('Master') + ']:not([Name])', xml).attr('Name', $(this).attr('Name'));
		});
		//console.log(xml);
		// Conditions
		$('[Name=OR],[Name=XOR],[Name=AND],[NameU=OR],[NameU=XOR],[NameU=AND]', xml).each(function() {
			var num, s1, s2, isXOR = ["XOR", "OR"].indexOf($(this).is('[NameU]')?$(this).attr('NameU'):$(this).attr('Name') ) != -1;
			if ($('Connect[ToSheet=' + $(this).attr('ID') + '][FromCell=BeginX]', xml).length > 1) {// Output
				s1 = 'BeginX';
				s2 = 'EndX';
			} else {
				s2 = 'BeginX';
				s1 = 'EndX';
			}
			num = $('Connect[FromCell=' + s1 + '][FromSheet=' + $('Connect[ToSheet=' + $(this).attr('ID') + '][FromCell=' + s2 + ']', xml).attr('FromSheet') + ']', xml).attr('ToSheet');
			$('Connect[ToSheet=' + $(this).attr('ID') + '][FromCell=' + s1 + ']', xml).each(function() {
				$('Connect[FromCell=' + s1 + '][FromSheet=' + $(this).attr('FromSheet') + ']', xml).attr('ToSheet', num).attr("isXOR", isXOR);
			});
			$('Shape[ID=' + num + ']', xml).attr(s2, isXOR);
		});
		$('Shape', xml).has('Cell[N=PinX],Cell[N=PinY]').each(function() {
			var nm=$(this).is('[NameU]')?$(this).attr('NameU'):$(this).attr('Name');
			var type = gettype(nm.replace(new RegExp("[0-9\.]",'g'),""), $(this).attr('FillStyle'));
			if (type) {
				obj = {
				  id : app.helper.generateId(),
				  objClass : type,
				  name : $('Text', this).text().replace('\n', ''),
				  position : {
				    left : parseInt(($('Cell[N=PinX]', this).attr('V') * app.options.settings.UI.objectWidth - app.options.settings.UI.objectWidth / 2) / app.options.settings.UI.gridSize) * app.options.settings.UI.gridSize,
				    top : app.options.settings.UI.gridSize * parseInt((100 * (top - $('Cell[N=PinY]', this).attr('V'))) / app.options.settings.UI.gridSize) + app.options.settings.UI.gridSize * 5
				  }
				};
				$.extend(obj, $(this).attr('BeginX') ? {
					prior : {
						execLogic : $(this).attr('BeginX') == 'true' ? app.options.types.logic.XOR : app.options.types.logic.AND
					}
				} : {},$(this).attr('EndX') ? {
					next : {
						allocLogic : $(this).attr('EndX') == 'true' ? app.options.types.logic.XOR : app.options.types.logic.AND
					}
				} : {});
				$('Shape[ID=' + $(this).attr('ID') + ']', xml).attr("newId", obj.id);
				// console.log(obj);
				create(obj)
			}
		});
		// Connections
		var links = {};
		$('Connect', xml).each(function() {
			if (typeof links[$(this).attr('FromSheet')] == 'undefined')
				links[$(this).attr('FromSheet')] = {};
			links[$(this).attr('FromSheet')][$(this).attr('FromCell')] = $(this).attr('ToSheet');
		});
		for ( var key in links) {
			var from = $('Shape[ID=' + links[key]['BeginX'] + ']', xml).attr("newId"), to = $('Shape[ID=' + links[key]['EndX'] + ']', xml).attr("newId")
			if (from && to)
				app.core.link(from, to);
		};
		// add comment
		api.model.items.import(app.options.types.objClass.bpComment, {
		  id : "commentBPSupport",
		  name : app.helper.trans("If have any question please contact support"),
		  position : {
		    left : app.options.settings.UI.gridSize * 5,
		    top : app.options.settings.UI.gridSize
		  }
		});
		app.events.add("modelAction", "import","visio");
	}
	return {
		load : function(data, model, callback) {
			zip.useWebWorkers = false;
			zip.createReader(new zip.BlobReader(data), function(zipReader) {
				zipReader.getEntries(function(entries) {
					entries.forEach(function(entry) {
						if (entry.filename == 'visio/pages/page1.xml') {
							entry.getData(new zip.TextWriter(), function(text) {
								parse($.parseXML(text));
								zipReader.close(function() {
									callback(model)
									// onclose callback
								});
							});
						}
					})
				});
			}, onerror);
		}
	}
}());