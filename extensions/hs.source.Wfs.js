define(function(require) {
    var ol = require('ol');
    return function(options) {
        var src = new ol.source.ServerVector({
            format: new ol.format.GeoJSON(),
            loader: function(extent, resolution, projection) {
                var p = options.url + (options.url.indexOf('?') > 0 ? '&' : '?') +
                    'service=WFS&TYPENAME=' + options.typename + '&request=GetFeature&' +
                    'version=1.0.0&' +
                    'SRSNAME=' + options.projection + '&outputFormat=geojson&' +
                    'bbox=' + extent.join(',') + ',urn:ogc:def:crs:EPSG:6.3:3857';
                var url = "/cgi-bin/hsproxy.cgi?toEncoding=utf-8&url=" + window.escape(p);

                $.ajax({
                        url: url
                    })
                    .done(function(response) {
                        src.clear();
                        src.addFeatures(src.readFeatures(response));
                    });
            },
            projection: options.projection
        });
        return src;
    };
});