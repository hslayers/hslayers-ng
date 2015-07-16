define(function(require) {
    var ol = require('ol');
    return function(options) {
        if (typeof options.version == 'undefined') options.version = '1.0.0';
        if (typeof options.hsproxy == 'undefined') options.hsproxy = true;
        if (typeof options.format == 'undefined') options.format = new ol.format.GeoJSON();
        if (typeof options.beforeSend == 'undefined') options.beforeSend = function(xhr) {};
        if (typeof options.parser == 'undefined') options.parser = function(response) {
            if (console) console.log(response);
            src.addFeatures(src.readFeatures(response));
        }

        var src = new ol.source.ServerVector({
            format: options.format,
            loader: function(extent, resolution, projection) {
                src.clear();
                if (console) console.log("resolution", resolution);
                var p = options.url + (options.url.indexOf('?') > 0 ? '&' : '?') +
                    'service=WFS&TYPENAME=' + options.typename + '&request=GetFeature&' +
                    'version=' + options.version + '&' +
                    'SRSNAME=' + options.projection + '&outputFormat=geojson&' +
                    'bbox=' + extent.join(',') + ',urn:ogc:def:crs:EPSG:6.3:3857';
                var url = options.hsproxy ? "/cgi-bin/hsproxy.cgi?toEncoding=utf-8&url=" + window.escape(p) : p;

                $.ajax({
                        url: url,
                        beforeSend: options.beforeSend
                    })
                    .done(function(response) {
                        src.addFeatures(options.parser(response));
                    });
            },
            projection: options.projection
        });
        return src;
    };
});
