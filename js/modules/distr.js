;
window.app = window.app || {};
app.dstr = (function() {
    var gauss = function(cnt, i, avr) {
        var boxmuller = function() {
            var s = 2 * Math.random() - 1;
            var m = 2 * Math.random() - 1;
            var u = s * s + m * m;
            if (u == 0 || u > 1) return boxmuller();
            var k = Math.sqrt(-2 * Math.log(u) / u);
            return s * m;
        }
        return boxmuller() + avr;
    }
    var m = {
        //Periodic distribution cnt tasks from 0 incl to 1 excl		
        period: function(cnt, i) {
            return parseFloat(i * 1 / cnt);
        },
        //Random Uniformly distribution cnt tasks from 0 incl to 1 excl
        uniformly: function(cnt) {
            return Math.random();
        },
        //Random Gauss distribution cnt tasks from 0 incl to 1 excl
        //avr - average= 0,5
        normal: function(cnt, i) {
            return gauss(cnt, i, 0.5);
        },
        //Random Gauss distribution cnt tasks from 0 incl to 1 excl
        //avr - average = 1
        exprise: function(cnt, i) {
            let a = gauss(cnt, i, 1);
            a = a >= 1 ? 2 - a : a;
            return 2 * (a - 0.5);
        },
        //Random Gauss distribution cnt tasks from 0 incl to 1 excl
        //avr - average = 0
        expfade: function(cnt, i) {
            return Math.abs(gauss(cnt, i, 0)) * 2;
        }
    }


    return {
        set: function(init, cnt, mult, funcId) {
            var arr = [],
                funcId = typeof funcId != 'undefined' ? funcId : app.options.types.distrType.uniformly,
                func = m[Object.keys(app.options.types.distrType)[funcId]];
            for (var i = 0; i < cnt; i++) {
                arr.push(parseInt(parseFloat(func(cnt, i)) * mult) + init);
            }
            return arr.sort(function(a, b) { return a - b });
        },
        test: function(arr, val) {
            for (var i = 0; i < arr.length; i++) {
                arr[i] = parseInt(arr[i] * val);
            }
            return arr;
        },
        methods: m
    }
})();