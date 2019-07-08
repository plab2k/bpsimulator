;
app.loader = (function() {
    'use strict';
    var load = function(url, callback) {
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.async = true;
        script.src = url;
        script.onload = callback ? callback : null;
        document.body.appendChild(script);
    };
    var ggltag = function() {
            window.googletag = window.googletag || {};
            googletag.cmd = googletag.cmd || [];
            load('//www.googletagservices.com/tag/js/gpt.js');
            googletag.cmd.push(function() {
                googletag.defineSlot('/30806496/bpsimulator.app.main', [
                    [200, 200],
                    [180, 150],
                    [125, 125],
                    [120, 240]
                ], 'div-gpt-ad-1436956489175-0').addService(googletag.pubads());
                googletag.pubads().enableSingleRequest();
                googletag.pubads().setTargeting("promo", "false");
                googletag.enableServices();
                setTimeout(function() {
                    app.events.showad();
                }, 1000)
            });
        }
        // [[336,280],[300,250],[250,250],[200,200]] //[200, 200] , [180, 150], [125, 125], [120, 240]
    return {
        afterinit: function() {
            // load('//code.jivosite.com/script/widget/YSADtqW1Cb');
            ggltag();
            if (/Edge\/|Trident\/|MSIE /.test(window.navigator.userAgent))
                app.snackbar.show('Browser Unsupported');
        }
    }
}());