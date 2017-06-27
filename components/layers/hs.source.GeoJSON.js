define(['ol'], function (ol) {
    return function(options) {
        var format = new ol.format.GeoJSON();
        var src = new ol.source.Vector({
            format: format,
            extractStyles: options.extractStyles,
            projection: ol.proj.get(options.featureProjection),
            loader: function(extent, resolution, projection) {
                $.ajax({
                    url: options.url,
                    success: function(data) {
                        src.addFeatures(format.readFeatures(data, {
                            dataProjection: options.dataProjection || 'EPSG:4326',
                            featureProjection: options.featureProjection
                        }));
                    }
                });
            },
            strategy: ol.loadingstrategy.all,
            projection: options.projection
        });
        src.options = options;
        return src;
    };
});
