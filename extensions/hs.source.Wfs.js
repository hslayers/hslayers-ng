define(function(require) {
    var ol = require('ol');
    return function(options) {
        if(typeof options.version == 'undefined') options.version = '1.0.0';
        if(typeof options.hsproxy == 'undefined') options.hsproxy = true;
        if(typeof options.beforeSend == 'undefined') options.beforeSend = function (xhr) {};
        var src = new ol.source.ServerVector({
            format: new ol.format.GeoJSON(),
            loader: function(extent, resolution, projection) {
                src.clear();
                var p = options.url + (options.url.indexOf('?') > 0 ? '&' : '?') +
                    'service=WFS&TYPENAME=' + options.typename + '&request=GetFeature&' +
                    'version='+options.version+'&' +
                    'SRSNAME=' + options.projection + '&outputFormat=geojson&' +
                    'bbox=' + extent.join(',') + ',urn:ogc:def:crs:EPSG:6.3:3857';
                var url = options.hsproxy ? "/cgi-bin/hsproxy.cgi?toEncoding=utf-8&url=" + window.escape(p) : p;

                $.ajax({
                        url: url,
                        beforeSend: options.beforeSend
                    })
                    .done(function(response) {
                        src.addFeatures(src.readFeatures(response));
                    });
            },
            projection: options.projection
        });
        return src;
    };
});
