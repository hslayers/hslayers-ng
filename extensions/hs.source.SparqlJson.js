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
                if (src.options.url == '') return;
                var p = src.options.url;
                var first_pair = [extent[0], extent[1]];
                var second_pair = [extent[2], extent[3]];
                first_pair = ol.proj.transform(first_pair, 'EPSG:3857', 'EPSG:4326');
                second_pair = ol.proj.transform(second_pair, 'EPSG:3857', 'EPSG:4326');
                var extent = [first_pair[0], first_pair[1], second_pair[0], second_pair[1]];
                var s_extent = 'FILTER(bif:st_intersects(bif:st_geomfromtext("BOX(' + extent[0] + ' ' + extent[1] + ', ' + extent[2] + ' ' + extent[3] + ')"), bif:st_point(xsd:decimal(?lon), xsd:decimal(?lat)))).';
                p = p.replace("<extent>", s_extent);
                p = "/cgi-bin/hsproxy.cgi?toEncoding=utf-8&url=" + encodeURIComponent(p);
                src.loaded = true;
                $.ajax({
                        url: p
                    })
                    .done(function(response) {
                        var objects = {};
                        for (var i = 0; i < response.results.bindings.length; i++) {
                            var b = response.results.bindings[i];
                            if (typeof objects[b.o.value] === 'undefined') {
                                objects[b.o.value] = {};
                            }
                            objects[b.o.value][b.p.value] = b.s.value;
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
                        for (var key in objects) {
                            i++;
                            if (objects[key]["http://www.w3.org/2003/01/geo/wgs84_pos#long"] && objects[key]["http://www.w3.org/2003/01/geo/wgs84_pos#long"] && objects[key]["http://www.w3.org/2003/01/geo/wgs84_pos#lat"] != "" && objects[key]["http://www.w3.org/2003/01/geo/wgs84_pos#long"] != "") {
                                var x = parseFloat(objects[key]["http://www.w3.org/2003/01/geo/wgs84_pos#long"]);
                                var y = parseFloat(objects[key]["http://www.w3.org/2003/01/geo/wgs84_pos#lat"]);
                                if (!isNaN(x) && !isNaN(y)) {
                                    var coord = ol.proj.transform([x, y], 'EPSG:4326', 'EPSG:3857');
                                    if (typeof occupied_xy[coord] !== 'undefined') continue;
                                    objects[key].geometry = new ol.geom.Point(coord);
                                    var feature = new ol.Feature(objects[key]);
                                    if (objects[key][options.category_field]) {
                                        if (typeof category_map[objects[key][options.category_field]] === 'undefined') {
                                            category_map[objects[key][options.category_field]] = {
                                                id: category_id,
                                                name: objects[key][options.category_field]
                                            };
                                            category_id++;
                                        }
                                        feature.category_id = category_map[objects[key][options.category_field]].id;
                                    }
                                    occupied_xy[coord] = true;
                                    features.push(feature);
                                }
                            }
                        }
                        for (var categ in category_map) {
                            category_map[categ].color = rainbow(category_id, category_map[categ].id, 0.7);
                        }
                        src.legend_categories = category_map;
                        for (var i = 0; i < features.length; i++) {
                            if (features[i].category_id) {
                                features[i].color = rainbow(category_id, features[i].category_id, 0.7);
                            }
                        }
                        src.addFeatures(features);
                    });
            },
            strategy: ol.loadingstrategy.bbox,
            projection: options.projection
        });
        src.options = options;
        src.legend_categories = category_map;
        return src;
    };
});
