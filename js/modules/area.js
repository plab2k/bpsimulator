;
var app = app || {};
app.area = (function() {
    'use strict';
    var connect = document.getElementById("bpm-connect");
    var figures = document.getElementById("bpm-figures");
    var _seg = {
        ver: {},
        hor: {}
    };
    var createSVGtext = function(caption, x, y) {
        var svgText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        svgText.setAttributeNS(null, 'x', x);
        svgText.setAttributeNS(null, 'y', y);
        var MAXIMUM_CHARS_PER_LINE = 24;
        var LINE_HEIGHT = 15;
        var words = caption.split(" ");
        var line = "";
        for (var n = 0; n < words.length; n++) {
            var testLine = line + words[n] + " ";
            if (testLine.length > MAXIMUM_CHARS_PER_LINE) {
                var svgTSpan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
                svgTSpan.setAttributeNS(null, 'x', x);
                svgTSpan.setAttributeNS(null, 'y', y);
                var tSpanTextNode = document.createTextNode(line);
                svgTSpan.appendChild(tSpanTextNode);
                svgText.appendChild(svgTSpan);
                line = words[n] + " ";
                y += LINE_HEIGHT;
            } else {
                line = testLine;
            }
        }
        var svgTSpan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
        svgTSpan.setAttributeNS(null, 'x', x);
        svgTSpan.setAttributeNS(null, 'y', y);
        var tSpanTextNode = document.createTextNode(line);
        svgTSpan.appendChild(tSpanTextNode);
        svgText.appendChild(svgTSpan);
        return svgText;
    };
    return {
        segments: _seg,
        clearAll: function() {
            if (typeof connect == 'undefined' || connect == null)
                connect = document.getElementById("bpm-connect");
            var clone = connect.cloneNode(false);
            if (figures == null || typeof figures == 'undefined')
                figures = document.getElementById("bpm-figures");
            while (figures.firstChild)
                figures.removeChild(figures.firstChild);
            figures.appendChild(clone);
            connect = clone;
            return this
        },
        clearConnect: function() {
            while (connect.firstChild)
                connect.removeChild(connect.firstChild);
            this.segments = {
                ver: {},
                hor: {}
            };
        },
        update: function() {
            return this
        },
        figure: {
            add: function(options) {
                var width = app.options.settings.UI.objectWidth,
                    radius = 5,
                    indent = 10,
                    d, figure, height = 40,
                    txt, elemArr = [],
                    title, group;
                var grp = document.createElementNS("http://www.w3.org/2000/svg", "g");
                if (options.classes == "bpComment")
                    txt = createSVGtext(options.text, 5, 11);
                else
                    txt = createSVGtext(options.text, width / 2, 11);
                elemArr.push(txt);
                height = txt.childNodes.length * 14 + 5;
                var dx = 10 + 16 + 1,
                    dy = height + 10;
                if (app.options.objectStates[options.classes]) {
                    for (var i = 0; i < app.options.objectStates[options.classes].length; i++) {
                        if (i % 2 == 0) {
                            dx = 10 + 16 + 1;
                            if (i != 0)
                                dy += 5 + 16;
                        } else {
                            dx = width / 2 + 16 + 1;
                        }
                        group = document.createElementNS("http://www.w3.org/2000/svg", "g");
                        txt = document.createElementNS("http://www.w3.org/2000/svg", "use");
                        txt.setAttributeNS('http://www.w3.org/1999/xlink', 'href', '#' + app.options.objectStates[options.classes][i].icon);
                        txt.setAttribute("class", "s_icon");
                        txt.setAttribute("x", dx - 18);
                        txt.setAttribute("y", dy - 11);
                        txt.setAttribute("width", 16);
                        txt.setAttribute("height", 16);
                        group.appendChild(txt);
                        txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
                        txt.setAttribute("x", dx);
                        txt.setAttribute("y", dy);
                        txt.setAttribute("class", "propval");
                        txt.textContent = "";
                        title = document.createElementNS("http://www.w3.org/2000/svg", "title");
                        title.textContent = app.helper.trans(app.options.objectStates[options.classes][i].name);
                        txt.appendChild(title);
                        group.appendChild(title);
                        group.appendChild(txt);
                        elemArr.push(group);
                    }
                    height = dy + 10;
                }
                height = Math.max(40, height);
                switch (options.classes) {
                    case "bpFunction":
                        figure = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                        figure.setAttribute("width", width);
                        figure.setAttribute("height", height);
                        figure.setAttribute("rx", radius);
                        figure.setAttribute("ry", radius);
                        break;
                    case "bpGenerator":
                        figure = document.createElementNS("http://www.w3.org/2000/svg", "path");
                        d = "M" + (indent) + ",0h" + (width - indent) + "l-" + indent + "," + height + "h-" + (width - indent) + "z";
                        figure.setAttribute("d", d);
                        break;
                    case "bpCheckpoint":
                        figure = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                        figure.setAttribute("width", width);
                        figure.setAttribute("height", height);
                        figure.setAttribute("rx", radius);
                        figure.setAttribute("ry", radius);
                        break;
                    case "bpEvent":
                        figure = document.createElementNS("http://www.w3.org/2000/svg", "path");
                        d = "M" + (width / 2) + ",0h" + (width / 2 - indent) + "l" + indent + "," + height / 2 + "l-" + indent + "," + height / 2 + "h-" + (-indent * 2 + width) + "l-" + indent + ",-" + height / 2 + "l" + indent + ",-" + height / 2 + "z";
                        figure.setAttribute("d", d);
                        break;
                    case "bpExecute":
                        figure = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                        figure.setAttribute("width", width);
                        figure.setAttribute("height", height);
                        figure.setAttribute("rx", radius * 4);
                        figure.setAttribute("ry", radius * 4);
                        break;
                    case "bpSupport":
                        figure = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                        figure.setAttribute("width", width);
                        figure.setAttribute("height", height);
                        figure.setAttribute("rx", radius / 2);
                        figure.setAttribute("ry", radius / 2);
                        break;
                    case "bpProcedure":
                        figure = document.createElementNS("http://www.w3.org/2000/svg", "g");
                        var fig = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                        fig.setAttribute("x", 5);
                        fig.setAttribute("y", 5);
                        fig.setAttribute("width", width - 5);
                        fig.setAttribute("height", height - 5);
                        fig.setAttribute("rx", radius);
                        fig.setAttribute("ry", radius);
                        figure.appendChild(fig);
                        fig = fig.cloneNode();
                        fig.setAttribute("x", 0);
                        fig.setAttribute("y", 0);
                        figure.appendChild(fig);
                        break;
                    case "bpInOut":
                        figure = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                        figure.setAttribute("width", width);
                        figure.setAttribute("height", height);
                        figure.setAttribute("rx", radius / 2);
                        figure.setAttribute("ry", radius / 2);
                        break;
                    case "bpRegulate":
                        figure = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                        figure.setAttribute("width", width);
                        figure.setAttribute("height", height);
                        figure.setAttribute("rx", radius / 2);
                        figure.setAttribute("ry", radius / 2);
                        break;
                    case "bpComment":
                        figure = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                        figure.setAttribute("width", width);
                        figure.setAttribute("height", height);
                        break;
                    case "bpCheckPoint":
                        figure = document.createElementNS("http://www.w3.org/2000/svg", "path");
                        d = "M0,0h" + width + "l-" + indent / 2 + "," + height + "h-" + (-indent + width) + "z";
                        figure.setAttribute("d", d);
                        figure.setAttribute("width", width);
                        figure.setAttribute("height", height);
                        break;
                };
                grp.setAttribute("class", options.classes + " bpm-obj");
                grp.setAttribute("id", options.id);
                grp.setAttribute("width", width);
                grp.setAttribute("height", height);
                grp.setAttribute("transform", "translate(" + options.x + "," + options.y + ")");
                /* FF bug with draggable */
                grp.setAttribute("style", "left:" + options.x + "px; top:" + options.y + "px;");
                grp.appendChild(figure);
                //Log show
                if (app.options.settings.UI.isShowLog) {
                    let lastheight = figure.hasAttribute("height") ? parseFloat(figure.getAttribute("height")) : height;
                    figure = document.createElementNS("http://www.w3.org/2000/svg", "foreignObject");
                    figure.setAttribute("y", lastheight - 8);
                    figure.setAttribute("x", 10);
                    //figure.innerHTML = 'Your <br>words <br> here';
                    grp.appendChild(figure);
                }
                $.each(elemArr, function() {
                        grp.appendChild(this);
                    })
                    // figures.appendChild(grp);
                return grp
            }
        },
        polyline: {
            _polyline: null,
            _points: null,
            _class: null,
            _from: null,
            _to: null,
            _mark: null,
            _isLong: null,
            _xor: function(x, y) {
                var txt, from = app.model.objects[this._from],
                    to = app.model.objects[this._to];
                if (from.next && to.prior && from.next.allocLogic == app.options.types.logic.XOR) {
                    txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
                    txt.setAttribute("x", x + 2);
                    txt.setAttribute("y", y + 10);
                    txt.textContent = $.map(from.next.objects, function(val, i) {
                        return val.obj == to.id ? from.next.objects[i].allocationPercent : null
                    }) + "%";
                    this._mark = txt;
                } else
                    this._mark = null
            },
            start: function(from, to, classes) {
                // this._polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
                this._polyline = document.createElementNS("http://www.w3.org/2000/svg", "path");
                this._class = classes;
                this._points = [];
                this._from = from;
                this._to = to;
                this._isLong = false;
                return this
            },
            add: function(x, y) {
                if (this._points.length == 0)
                    this._xor(x, y);
                // this._points.push(parseInt(x) + "," + parseInt(y));
                this._points.push({
                    x: parseInt(x),
                    y: parseInt(y)
                })
                return this
            },
            end: function() {
                var id = this._from + this._to;
                var exist = document.getElementById(id);
                var link = document.createElementNS("http://www.w3.org/2000/svg", "a");
                if (typeof connect == 'undefined' || connect == null)
                    connect = document.getElementById("bpm-connect");
                link.setAttribute("xlink:href", "#");
                if (this._class)
                    link.setAttribute("class", this._class);
                link.setAttributeNS(null, "data-from", this._from);
                link.setAttributeNS(null, "data-to", this._to);
                link.setAttributeNS(null, "id", id);
                // this._polyline.setAttribute('points', this._correct().join(" "));
                this._polyline.setAttribute('d', this._correct());
                var clone = this._polyline.cloneNode();
                if (this._isLong === true)
                    this._polyline.setAttributeNS(null, "class", "long");
                link.appendChild(this._polyline);
                if (this._mark)
                    link.appendChild(this._mark);
                link.appendChild(clone);
                if (!!exist)
                    connect.replaceChild(link, exist);
                else
                    connect.appendChild(link);
                return this
            },
            unlink: function(from, to) {
                var node = document.getElementById(from + to);
                if (!!node)
                    connect.removeChild(node)
            },
            _testcross: function(p1, p2, p3, p4) {
                if (p3.X == p4.X) // вертикаль
                {
                    const y = p1.Y + ((p2.Y - p1.Y) * (p3.X - p1.X)) / (p2.X - p1.X);
                    if (y > Math.max(p3.Y, p4.Y) || y < Math.min(p3.Y, p4.Y) || y > Math.max(p1.Y, p2.Y) || y < Math.min(p1.Y, p2.Y)) // если за пределами отрезков
                        return null;
                    else
                        return {
                            x: p3.X,
                            y: y
                        };
                } else // горизонталь
                {
                    const x = p1.X + ((p2.X - p1.X) * (p3.Y - p1.Y)) / (p2.Y - p1.Y);
                    if (x > Math.max(p3.X, p4.X) || x < Math.min(p3.X, p4.X) || x > Math.max(p1.X, p2.X) || x < Math.min(p1.X, p2.X)) // если за пределами отрезков
                        return null;
                    else
                        return {
                            x: x,
                            y: p3.Y
                        };
                }
            },
            _correct: function() {
                var i, lp = null,
                    x, y, seg = app.area.segments;
                // optimize path - remove doubles
                for (i = this._points.length - 2; i > 0; i--) {
                    if ((this._points[i].y == this._points[i - 1].y && this._points[i].y == this._points[i + 1].y) || (this._points[i].x == this._points[i - 1].x && this._points[i].x == this._points[i + 1].x))
                        this._points.splice(i, 1)
                }
                // rearrange points
                for (i = 1; i < this._points.length; i++) {
                    if (seg && this._points[i].x == this._points[i - 1].x && seg.ver[this._points[i].x]) { // vertical segment
                        var from = this._points[i - 1].y,
                            to = this._points[i].y;
                        if ($.map(seg.ver[this._points[i].x], function(point) {
                                return (Math.min(Math.max(point.from, point.to), Math.max(from, to)) > Math.max(Math.min(point.from, point.to), Math.min(from, to))) ? point : null
                            }).length > 0) {
                            for (var ii = i - 1; ii < this._points.length; ii++) {
                                if (!(ii == this._points.length - 1 && this._points[ii].y == this._points[ii - 1].y))
                                    this._points[ii].x += 3;
                            }
                        }
                    } else if (seg && this._points[i].y == this._points[i - 1].y && seg.hor[this._points[i].y]) { // horisontal segment
                        var from = this._points[i - 1].x,
                            to = this._points[i].x;
                        if ($.map(seg.hor[this._points[i].y], function(point) {
                                return (Math.min(Math.max(point.from, point.to), Math.max(from, to)) > Math.max(Math.min(point.from, point.to), Math.min(from, to))) ? point : null
                            }).length > 0) {
                            for (var ii = i - 1; ii < this._points.length; ii++) {
                                if (!(ii == this._points.length - 1 && this._points[ii].x == this._points[ii - 1].x))
                                    this._points[ii].y += 3;
                            }
                        }
                    }
                }
                // check longer
                for (i = 1; i < this._points.length; i++) {
                    if (Math.max(Math.max(this._points[i - 1].x, this._points[i].x) - Math.min(this._points[i - 1].x, this._points[i].x), Math.max(this._points[i - 1].y, this._points[i].y) - Math.min(this._points[i - 1].y, this._points[i].y)) > 500) {
                        this._isLong = true;
                        break;
                    }
                }
                // add arc
                var path = "M" + this._points[0].x + "," + this._points[0].y,
                    radius, dir, v;
                for (i = 1; i < this._points.length; i++) {
                    // find crossing
                    if (seg && this._points[i].x == this._points[i - 1].x) { // vertical
                        var arr = [];
                        for (var key in seg.hor) {
                            arr.push(parseInt(key))
                        }
                        if (this._points[i - 1].y > this._points[i].y)
                            arr.reverse();
                        for (var key in arr) {
                            y = arr[key];
                            if (Math.min(this._points[i - 1].y, this._points[i].y) <= y && y <= Math.max(this._points[i - 1].y, this._points[i].y)) {
                                for (var ii = 0; ii < seg.hor[y].length; ii++) {
                                    var point = this._testcross({
                                        X: this._points[i - 1].x,
                                        Y: this._points[i - 1].y
                                    }, {
                                        X: this._points[i].x,
                                        Y: this._points[i].y
                                    }, {
                                        X: seg.hor[y][ii].from,
                                        Y: y
                                    }, {
                                        X: seg.hor[y][ii].to,
                                        Y: y
                                    });
                                    if ((point && !this._points[i + 1]) || (point && this._points[i + 1] && Math.max(point.y, this._points[i + 1].y) - Math.min(point.y, this._points[i + 1].y) > app.options.connectRadius * 2 && Math.max(point.y, this._points[i - 1].y) - Math.min(point.y, this._points[i - 1].y) > app.options.connectRadius * 2)) {
                                        if (this._points[i].y > y) {
                                            path += "L" + this._points[i].x + "," + (point.y - app.options.connectRadius);
                                            path += "A" + app.options.connectRadius + "," + app.options.connectRadius + " 0 0 1 " + this._points[i].x + "," + (point.y + app.options.connectRadius);
                                        } else {
                                            path += "L" + this._points[i].x + "," + (point.y + app.options.connectRadius);
                                            path += "A" + app.options.connectRadius + "," + app.options.connectRadius + " 0 0 0 " + this._points[i].x + "," + (point.y - app.options.connectRadius);
                                        }
                                    }
                                }
                            }
                        }
                    } else if (seg && this._points[i].y == this._points[i - 1].y) { // horizontal
                        var arr = [];
                        for (var key in seg.ver) {
                            arr.push(parseInt(key))
                        }
                        if (this._points[i - 1].x > this._points[i].x)
                            arr.reverse();
                        for (var key in arr) {
                            x = arr[key];
                            if (Math.min(this._points[i - 1].x, this._points[i].x) <= x && x <= Math.max(this._points[i - 1].x, this._points[i].x)) {
                                for (var ii = 0; ii < seg.ver[x].length; ii++) {
                                    var point = this._testcross({
                                        X: this._points[i - 1].x,
                                        Y: this._points[i - 1].y
                                    }, {
                                        X: this._points[i].x,
                                        Y: this._points[i].y
                                    }, {
                                        X: x,
                                        Y: seg.ver[x][ii].from
                                    }, {
                                        X: x,
                                        Y: seg.ver[x][ii].to
                                    });
                                    if ((point && !this._points[i + 1]) || (point && this._points[i + 1] && Math.max(point.x, this._points[i + 1].x) - Math.min(point.x, this._points[i + 1].x) > app.options.connectRadius * 2 && Math.max(point.x, this._points[i - 1].x) - Math.min(point.x, this._points[i - 1].x) > app.options.connectRadius * 2)) {
                                        radius = app.options.connectRadius;
                                        if (this._points[i].x > x) {
                                            path += "L" + (point.x - radius) + "," + this._points[i].y;
                                            path += "A" + radius + "," + radius + " 0 0 1 " + (point.x + radius) + "," + this._points[i].y;
                                        } else {
                                            path += "L" + (point.x + radius) + "," + this._points[i].y;
                                            path += "A" + radius + "," + radius + " 0 0 0 " + (point.x - radius) + "," + this._points[i].y;
                                        }
                                    }
                                }
                            }
                        }
                    };
                    if (i == this._points.length - 1)
                        break;
                    dir = "";
                    radius = Math.min(app.options.connectRadius, Math.min(Math.max(this._points[i - 1].x, this._points[i + 1].x) - Math.min(this._points[i - 1].x, this._points[i + 1].x), Math.max(this._points[i - 1].y, this._points[i + 1].y) - Math.min(this._points[i - 1].y, this._points[i + 1].y)));
                    v = false;
                    if (this._points[i - 1].x != this._points[i].x) { // horizontal
                        if (this._points[i - 1].x > this._points[i].x) {
                            path += "L" + (this._points[i].x + radius) + "," + this._points[i].y;
                            v = true;
                            // /console.log("a1");
                        } else {
                            path += "L" + (this._points[i].x - radius) + "," + this._points[i].y;
                            // console.log("a2");
                        }
                    } else { // vertical
                        if (this._points[i - 1].y > this._points[i].y) {
                            path += "L" + this._points[i].x + "," + (this._points[i].y + radius);
                            // console.log("a3");
                        } else {
                            path += "L" + this._points[i].x + "," + (this._points[i].y - radius);
                            v = true;
                            // console.log("a4");
                        }
                    };
                    if (this._points[i + 1].x != this._points[i].x) { // horizontal
                        if (this._points[i + 1].x > this._points[i].x) {
                            path += "A" + radius + "," + radius + " 0 0 " + (v ? 0 : 1) + " " + (this._points[i].x + radius) + "," + this._points[i].y;
                            // console.log(3)
                        } else {
                            path += "A" + radius + "," + radius + " 0 0 " + (v ? 1 : 0) + " " + (this._points[i].x - radius) + "," + this._points[i].y;
                            // console.log(4);
                        }
                    } else { // vertical
                        if (this._points[i + 1].y > this._points[i].y) {
                            path += "A" + radius + "," + radius + " 0 0 " + (v ? 0 : 1) + " " + this._points[i].x + "," + (this._points[i].y + radius);
                            // console.log(1)
                        } else {
                            path += "A" + radius + "," + radius + " 0 0 " + (v ? 1 : 0) + " " + this._points[i].x + "," + (this._points[i].y - radius);
                            // console.log(2)
                        }
                    };
                }
                path += "L" + this._points[this._points.length - 1].x + "," + this._points[this._points.length - 1].y;
                // add segments of path
                for (i = 1; i < this._points.length; i++) {
                    x = this._points[i].x;
                    y = this._points[i].y;
                    if (this._points[i - 1].x == x)
                        if (seg.ver[x])
                            seg.ver[x].push({
                                from: Math.min(this._points[i - 1].y, y) + 1,
                                to: Math.max(this._points[i - 1].y, y) - 1
                            });
                        else
                            seg.ver[x] = [{
                                from: Math.min(this._points[i - 1].y, y) + 1,
                                to: Math.max(this._points[i - 1].y, y) - 1
                            }]
                    else if (this._points[i - 1].y == y) {
                        if (seg.hor[y])
                            seg.hor[y].push({
                                from: Math.min(this._points[i - 1].x, x) + 1,
                                to: Math.max(this._points[i - 1].x, x) - 1
                            });
                        else
                            seg.hor[y] = [{
                                from: Math.min(this._points[i - 1].x, x) + 1,
                                to: Math.max(this._points[i - 1].x, x) - 1
                            }]
                    } else
                        throw new Error("Bad link points value")
                }
                return path;
            }
        },
        grid: {
            show: function(show) {
                document.getElementById("bpmGrid").setAttributeNS(null, 'display', (show) ? "inline" : "none");
            },
            size: function(size) {
                var pattern = document.getElementById("bg");
                pattern.setAttribute('width', size * 5);
                pattern.setAttribute('height', size * 5);
            }
        }
    }
}());