;
(function($) {
	// bpsDashboard
	$.widget("ui.bpsDashboard", $.ui.bpsdialog, {
	  _create : function() {
		  if (typeof saveSvgAsPng != 'undefined')
			  $(".fbut", this.element).click(function() {
				  var copy = document.getElementById("svgdashboard");
				  saveSvgAsPng(copy, "Dashboard_" + app.model.info.name + '.png');
				  app.events.add("userAction", "ExportToPNG", "Dashboard");
				  return false;
			  });
		  else
			  $(".fbut", this.element).hide();
		  this._super();
	  },
	  _destroy : function() {
		  $(".fbut", this.element).unbind();
		  this._super();
	  },
	  _updateLeftBottom : function() {
		  var i;
		  var d_cr = "";
		  var arr = app.simulation.collector.getwaitQLength();
		  var mx = arr.length == 0 ? 10 : arr.sort(function(a, b) {
			  return b.count - a.count
		  })[0].count;
		  arr = arr.sort(function(a, b) {
			  return a.minutes - b.minutes
		  });
		  mx = Math.ceil(mx / 10) * 10;
		  for (i = 0; i < arr.length; i++) {
			  d_cr = d_cr.concat("M", arr[i].minutes, ",", mx - arr[i].count, "v", mx, "z");
		  }
		  $("#qlen")[0].setAttribute("viewBox", "0 0 1450 " + mx);
		  $("#qlen path")[0].setAttribute("d", d_cr);
		  $("#leftbottom g text:eq(0)").text(mx / 2);
		  $("#leftbottom g text:eq(1)").text(mx);
	  },
	  _updateLeftTop : function() {
		  var i, hour;
		  var d_cr = ""/* "M0,0v1z" */, d_cp = "" /* "M0,0v1z" */, mx = 0;
		  var arr = app.simulation.collector.getCrFin();
		  for (i = 0; i < arr.length; i++) {
			  hour = new Date(arr[i].range).getHours();
			  mx = Math.max(mx, arr[i].count)
			  if (arr[i].action === app.options.types.eventType.taskNew)
				  d_cr = d_cr.concat(" M", hour * 60, ",MAXv-", arr[i].count, "h30v", arr[i].count, "z");
			  else
				  d_cp = d_cp.concat(" M", hour * 60 + 30, ",MAXv-", arr[i].count, "h30v", arr[i].count, "z");
		  }
		  mx = Math.ceil(mx / 10) * 10;
		  $("#activity")[0].setAttribute("viewBox", "0 0 1450 " + mx);
		  $("#activity path:eq(0)")[0].setAttribute("d", d_cr.replace(/MAX/g, mx));
		  $("#activity path:eq(1)")[0].setAttribute("d", d_cp.replace(/MAX/g, mx));
		  $("#lefttop g text:eq(0)").text(mx / 2);
		  $("#lefttop g text:eq(1)").text(mx);
	  },
	  _updateGauge : function() {
		  var arr = app.simulation.collector.getwaitQLength();
		  var qlen = arr.length == 0 ? 0 : arr[arr.length - 1].count, qwork = app.simulation.collector.getWorkQlen();
		  var qlt = (qwork + qlen > 0) ? qwork / (qwork + qlen) : 0;
		  $("#gauge>g>text").text(parseInt(100 * qlt) + "%");
		  $("#gauge>g>path")[0].setAttribute("transform", "rotate(" + parseInt(qlt * 270) + ",75,75)");
	  },
	  _updateTopRight : function() {
		  var o = app.simulation.collector.getTaskStat(), sumgrad = 0, sum = o.processSum + o.deliverySum + o.waitingSum, grad, percent;
		  if (o.count == 0) {
			  return;
		  }
		  var path = function(from, to) {
			  var str = "", px = function(grad) {
				  return 60 * Math.cos((-90 + grad) * Math.PI / 180) + 70
			  };
			  var py = function(grad, diff) {
				  return 40 * Math.sin((-90 + grad) * Math.PI / 180) + 65 + diff
			  };
			  var sub = function(from, to) {// " + ((to - from > 180) ? 1 : 0) + "
				  str = str.concat("M" + px(from) + "," + py(from, 0) + "A60,40 0 0 1 " + px(to) + "," + py(to, 0) + "L70,65z");
				  if (from <= 270 && to > 90)
					  str = str.concat("M" + px(Math.max(from, 90)) + "," + py(Math.max(from, 90), 0) + "v15A60,40 0  0  1 " + px(Math.min(to, 270)) + "," + py(Math.min(to, 270), 15) + "v-15z")
			  };
			  sub(from, to - from > 180 ? from + 180 : to);
			  if (to - from > 180)
				  sub(from + 180, to)
			  return str
		  }
		  percent = o.waitingSum / sum;
		  grad = 360 * percent;
		  // console.log(grad);
		  $("#righttop path:eq(0)")[0].setAttribute("d", path(0, grad));
		  $("#righttop .perc tspan:eq(0)").text(percent > .03 ? Math.round(100 * percent) + "%" : "").attr("x", 40 * Math.cos((grad / 2 - 90) * Math.PI / 180) + 70).attr("y", 20 * Math.sin((grad / 2 - 90) * Math.PI / 180) + 65);
		  sumgrad += grad;
		  percent = o.deliverySum / sum;
		  grad = 360 * percent;
		  $("#righttop path:eq(1)")[0].setAttribute("d", path(sumgrad, sumgrad + grad));
		  $("#righttop .perc tspan:eq(1)").text(percent > .03 ? Math.round(100 * percent) + "%" : "").attr("x", 40 * Math.cos((grad / 2 + sumgrad - 90) * Math.PI / 180) + 70).attr("y", 20 * Math.sin((grad / 2 + sumgrad - 90) * Math.PI / 180) + 65);
		  sumgrad += grad;
		  percent = o.processSum / sum;
		  grad = 360 - sumgrad;
		  $("#righttop path:eq(2)")[0].setAttribute("d", path(sumgrad, 360));
		  $("#righttop .perc tspan:eq(2)").text(percent > .03 ? Math.round(100 * percent) + "%" : "").attr("x", 40 * Math.cos(((360 - sumgrad) / 2 + sumgrad - 90) * Math.PI / 180) + 70).attr("y", 20 * Math.sin((grad / 2 + sumgrad - 90) * Math.PI / 180) + 65);
		  $("#righttop .legend tspan:nth-child(even):eq(0)").text((o.processSum / o.count).toString().toHHMMSS());
		  $("#righttop .legend tspan:nth-child(even):eq(1)").text((o.deliverySum / o.count).toString().toHHMMSS());
		  $("#righttop .legend tspan:nth-child(even):eq(2)").text((o.waitingSum / o.count).toString().toHHMMSS());
	  },
	  _updateSummary : function() {
		  var i, sumcr = 0, sumfin = 0, arr = app.simulation.collector.getCrFin();
		  for (i = 0; i < arr.length; i++) {
			  if (arr[i].action === app.options.types.eventType.taskNew)
				  sumcr += arr[i].count
			  else
				  sumfin += arr[i].count
		  };
		  $("#rightbot tspan:eq(1)").text(Globalize.format(sumcr, "n0"));
		  $("#rightbot tspan:eq(3)").text(Globalize.format(sumfin, "n0"));
		  $("#rightbot tspan:eq(5)").text(Globalize.format(app.simulation.collector.getCostSum(), "c2"));
		  $("#rightbot tspan:eq(7)").text(app.simulation.collector.getTaktTime().toString().toHHMMSS());
		  $("#rightbot tspan:eq(9)").text(app.simulation.collector.getCicleTime().toString().toHHMMSS())[0].setAttribute("fill", app.simulation.collector.getTaktTime() == 0 ? "black" : app.simulation.collector.getTaktTime() >= app.simulation.collector.getCicleTime() ? "green" : "red");
	  },
	  update : function() {
		  var that = this, svg = $("svg", this.element)[0];
		  this._updateLeftBottom();
		  this._updateLeftTop();
		  this._updateGauge();
		  this._updateTopRight();
		  this._updateSummary();
		  $("#svgdashboard>use", this.element).each(function() {
			  svg.removeChild(this);
			  svg.appendChild(this);
		  });
	  }
	});
})(jQuery);