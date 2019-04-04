define(['ol'], function (ol) {
    return function(options) {
        var format = new ol.format.GeoJSON();
        debugger
        var src = new ol.source.Vector({
            format: format,
            extractStyles: options.extractStyles,
            projection: ol.proj.get(options.featureProjection),
            loader: function(extent, resolution, projection) {
                var xhr = new XMLHttpRequest();
                xhr.onload = function () {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        src.addFeatures(format.readFeatures(this.responseText, {
                            dataProjection: options.dataProjection || 'EPSG:4326',
                            featureProjection: options.featureProjection
                        }));
                    } else {
                        console.log('The request failed!');
                    }
                };
                xhr.open('GET', options.url);
                xhr.send();
            },
            strategy: ol.loadingstrategy.all,
            projection: options.projection
        });
        src.options = options;
        return src;
    };
});
