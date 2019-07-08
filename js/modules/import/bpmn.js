;
app.import = app.import || {};
app.import.bpmn = (function() {
	var $process;
	var objClasses = $.map(app.options.types.objClass, function(el) {
		return el
	});
	var parseElement = function(el) {
		var objClass = el.nodeName, res = {};
		switch (el.nodeName) {
			case "startEvent" :
				objClass = app.options.types.objClass.bpGenerator;
				break;
			case "endEvent" :
				objClass = app.options.types.objClass.bpCheckPoint;
				break;
			case "boundaryEvent" :
			case "event" :
			case "implicitThrowEvent" :
			case "intermediateCatchEvent" :
			case "intermediateThrowEvent" :
				objClass = app.options.types.objClass.bpEvent;
				break;
			case "adHocSubProcess" :
			case "businessRuleTask" :
			case "callableElement" :
			case "callActivity" :
			case "globalBusinessRuleTask" :
			case "globalScriptTask" :
			case "receiveTask" :
			case "sendTask" :
			case "serviceTask" :
			case "scriptTask" :
			case "subProcess" :
			case "task" :
			case "transaction" :
			case "userTask" :
				objClass = app.options.types.objClass.bpFunction;
				break;
			case "gateway" :
			case "complexGateway" :
			case "eventBasedGateway" :
			case "exclusiveGateway" :
			case "inclusiveGateway" :
			case "parallelGateway" :
				switch ($(el).attr("gatewayDirection")) {
					case "Converging" :
						res.prior = {
							execLogic : (el.nodeName == "parallelGateway") ? app.options.types.logic.AND : app.options.types.logic.XOR
						};
						break;
					case "Diverging" :
						res.next = {
							allocLogic : (el.nodeName == "parallelGateway") ? app.options.types.logic.AND : app.options.types.logic.XOR
						};
						break;
				}
				res._isgateway = true;
				objClass = app.options.types.objClass.bpFunction;
				break;
			case "resource" :
				objClass = app.options.types.objClass.bpExecute;
				break;
		}
		res = $.extend(true,res, {
		  objClass : objClass,
		  id : $(el).attr("id"),
		  name : $(el).attr("name") ? $(el).attr("name") : ""// $(el).attr("id")
		});
		return res
	};
	var lasttop = app.options.settings.UI.gridSize * 4;
	var lastleft = parseInt($("main").width() / 2 - app.options.settings.UI.objectWidth);
	var getpos = function(obj) {
		var l = 0;
		var t = 0;
		try {
			l = parseInt(obj._pos.left * (app.options.settings.UI.objectWidth / 2 + app.options.settings.UI.objectWidth) + lastleft);
			t = obj._pos.top * (app.options.settings.UI.gridSize * 5) + lasttop;
		} catch (err) {
		}
		return {
		  left : l,
		  top : t
		}
	};
	var create = function(item) {
		var obj;
		// console.log(item.id, item.objClass, item.name);
		if (objClasses.indexOf(item.objClass) > -1)
			return api.model.items.import(item.objClass, $.extend(true, {}, item, {
				position : getpos(item)
			}));
	};
	var next = function(obj) {
		addObj(obj);
		$("sequenceFlow[sourceRef='" + obj.id + "']", $process).each(function() {
			next(parseElement($("#" + $(this).attr("targetRef"), $process)[0]));
			addLink($(this).attr("sourceRef"), $(this).attr("targetRef"));
		});
	};
	var tree = {}, links = [];
	var addObj = function(obj) {
		if (tree[obj.id]) {
			//
		} else {
			tree[obj.id] = obj;
		}
	};
	var addLink = function(from, to) {
		if (typeof from == 'undefined' || typeof to == 'undefined')
			return;
		var item = from.concat(":", to);
		if (links.indexOf(item) == -1)
			links.push(item)
	};
	var deleteLink = function(id) {
		$.each($.map(links, function(item, i) {
			var a = item.split(":");
			return a[0] == id || a[1] == id ? i : null
		}).sort(function(a, b) {
			return b - a
		}), function(i, val) {
			links.splice(val, 1)
		})
	};
	var sourceRefs = function(id) {
		return $.map(links, function(item) {
			var a = item.split(":");
			return a[1] == id ? a[0] : null
		})
	};
	var targetRefs = function(id) {
		return $.map(links, function(item) {
			var a = item.split(":");
			return a[0] == id ? a[1] : null
		})
	};
	var splitGW = function(id) {
		var item = tree[id], inbound = !!!item.prior, neighbors = inbound ? sourceRefs(id) : targetRefs(id), antineighbors = !inbound ? sourceRefs(id) : targetRefs(id);
		if (neighbors.length == 1 && (!tree[neighbors[0]]["next"] && !tree[neighbors[0]]["prior"])) {
			tree[neighbors[0]][inbound ? "next" : "prior"] = item[inbound ? "next" : "prior"];
			delete tree[id];
			deleteLink(id);
			$.each(antineighbors, function(i, value) {
				addLink(inbound ? neighbors[0] : value, inbound ? value : neighbors[0]);
			});
		} else {
			item.objClass = app.options.types.objClass.bpFunction;
			item.runTimeMin = 0;
			item.runTimeMax = 0;
		}
	};
	var init = function() {
		tree = {};
		links = [];
		positions = {
			max : 0
		};
	};
	var arrange = function(id, top, left) {
		if (!tree[id]._pos)
			tree[id]._pos = {
			  top : top,
			  left : left
			};
		else
			return;
		$.each(targetRefs(id), function(i, val) {
			arrange(val, top + 1, leftpos(top + 1, left + i));
		})
	};
	var positions;
	var leftpos = function(top, lf) {
		var left = lf;
		if (!positions[top])
			positions[top] = {};
		while (!!positions[top][left]) {
			left++;
		}
		positions[top][left] = 1;
		positions.max = Math.max(left, positions.max ? positions.max : 0);
		return left
	}
	return {
		load : function(xml, model) {
			if ($("process", xml).has("task,startEvent,endEvent").length == 0)
				return;
			else
				$process = $("process", xml).has("task,startEvent,endEvent").eq(0);
			model.info.name = $process.attr("name") || "Process Name";
			init();
			// parse model
			$(">*:not(sequenceFlow)", $process).each(function() {
				addObj(parseElement(this));
			});
			$("sequenceFlow", $process).each(function() {
				addLink($(this).attr("sourceRef"), $(this).attr("targetRef"));
			});
			// parse resource
			$("resource", xml).each(function() {
				addObj(parseElement(this));
			});
			// split gateways
			for ( var id in tree) {
				if (tree[id]._isgateway === true)
					splitGW(id);
			};
			// rearrange objects
			var generators = $.map(tree, function(a) {
				return a.objClass == app.options.types.objClass.bpGenerator ? a.id : null
			});
			if (generators.length > 0)
				$.each(generators, function(i, val) {
					arrange(val, 0, i);
				});
			else
				arrange(Object.keys(tree)[0], 0, 0);
			// rearrange resource
			$.each($.map(tree, function(a) {
				return a.objClass == app.options.types.objClass.bpExecute ? a.id : null
			}), function(i, val) {
				arrange(val, i + 1, positions.max + 1);
			});
			// link resource
			$("resourceRef", $process).each(function() {
				addLink($(this).text().split(":")[1], $(this).closest('userTask').attr('id'))
			})
			// create objects
			for ( var id in tree) {
				var item = tree[id];
				if (objClasses.indexOf(item.objClass) > -1) {
					api.model.items.import(item.objClass, $.extend(true, {}, item, {
						position : getpos(item)
					}));
				}
			};
			// link objects
			for ( var i in links) {
				var lnk = links[i].split(":"), prop;
				var item = tree[lnk[0]];
				if (item && objClasses.indexOf(item.objClass) > -1) {
					if (item.next && item.next.allocLogic == app.options.types.logic.XOR && targetRefs(lnk[0]).length > 0) {
						prop = {
							allocationPercent : parseInt(100 / targetRefs(lnk[0]).length)
						};
					};
					if (app.model.objects[tree[lnk[0]].id] && app.model.objects[tree[lnk[1]].id])
						app.core.link(tree[lnk[0]].id, tree[lnk[1]].id, prop ? prop : null);
				}
			};
			// add comment
			api.model.items.import(app.options.types.objClass.bpComment, {
			  id : "commentBPSupport",
			  name : app.helper.trans("If have any question please contact support"),
			  position : {
			    left : parseInt((positions.max + 1) * (app.options.settings.UI.objectWidth / 2 + app.options.settings.UI.objectWidth) + lastleft),
			    top : lasttop
			  }
			});
			app.events.add("modelAction", "import","bpmn");
		}
	}
}());