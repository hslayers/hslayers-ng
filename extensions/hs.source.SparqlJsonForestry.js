define(function(require) {
    var ol = require('ol');
    return function(options) {
        var category_map = {};
        var category_id = 0;
        var occupied_xy = {};
        var src = new ol.source.ServerVector({
            format: new ol.format.GeoJSON(),
            loader: function(extent, resolution, projection) {
                if (typeof src.options.clear_on_move !== 'undefined' && src.options.clear_on_move) src.clear();
                if (typeof options.hsproxy == 'undefined') options.hsproxy = false;
                if (src.options.url == '') return;
                var p = src.options.url;
                if (options.hsproxy)
                    p = "/cgi-bin/hsproxy.cgi?toEncoding=utf-8&url=" + encodeURIComponent(p);
                src.loaded = true;
                $.ajax({
                        url: p
                    })
                    .done(function(response) {
                        var objects = {};
                        var min = Number.MAX_VALUE;
                        var max = Number.MIN_VALUE;
                        for (var i = 0; i < response.results.bindings.length; i++) {
                            var b = response.results.bindings[i];
                            if (typeof objects[b.o.value] === 'undefined') {
                                objects[b.o.value] = {};
                            }
                            objects[b.o.value].geom = b.geom.value;
                            objects[b.o.value].value = b.value.value;
                            objects[b.o.value].nut = b.nut.value;
                            if (min > parseFloat(b.value.value)) min = parseFloat(b.value.value);
                            if (max < parseFloat(b.value.value)) max = parseFloat(b.value.value);
                        }
                        var features = [];
                        var i = 0.0;
                        var rainbow = function(numOfSteps, step, opacity) {
                            // based on http://stackoverflow.com/a/7419630
                            // This function generates vibrant, "evenly spaced" colours (i.e. no clustering). This is ideal for creating easily distiguishable vibrant markers in Google Maps and other apps.
                            // Adam Cole, 2011-Sept-14
                            // HSV to RBG adapted from: http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
                            var r, g, b;
                            var h = step / (numOfSteps * 1.00000001);
                            var i = ~~(h * 4);
                            var f = h * 4 - i;
                            var q = 1 - f;
                            switch (i % 4) {
                                case 2:
                                    r = f, g = 1, b = 0;
                                    break;
                                case 0:
                                    r = 0, g = f, b = 1;
                                    break;
                                case 3:
                                    r = 1, g = q, b = 0;
                                    break;
                                case 1:
                                    r = 0, g = 1, b = q;
                                    break;
                            }
                            var c = "rgba(" + ~~(r * 235) + "," + ~~(g * 235) + "," + ~~(b * 235) + ", " + opacity + ")";
                            return (c);
                        }
                        var step = (max-min)/10.0;
                        for (var c = 0; c <= 10; c++) {
                            var l_bound = parseFloat((min + c*step));
                            var u_bound = parseFloat(min + (c+1.0)*step);
                            
                            category_map[c] = {
                                name:  l_bound.toFixed(2)+ " - " + u_bound.toFixed(2)  ,
                                color: rainbow(10, c, 0.7)
                            };
                        }

                        for (var key in objects) {
                            i++;
                            var format = new ol.format.WKT();
                            var feature = format.readFeature(objects[key].geom);
                            feature.set('Value', objects[key].value);
                            feature.set('Nuts region', objects[key].nut);
                            feature.color = rainbow(10, parseInt((objects[key].value - min) / ((max - min) / 10)), 0.7);
                            feature.getGeometry().transform('EPSG:4326', 'EPSG:3857');
                            features.push(feature);
                        }
                        src.addFeatures(features);
                    });
            },
            strategy: ol.loadingstrategy.all,
            projection: options.projection
        });
        src.options = options;
        src.legend_categories = category_map;
        return src;
    };
});
