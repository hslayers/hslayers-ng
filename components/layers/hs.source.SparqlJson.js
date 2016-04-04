define(function(require) {
    var ol = require('ol');

    function rainbow(numOfSteps, step, opacity) {
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

    function loadFeatures(objects, src, options, occupied_xy, category_map, category_id) {
        var features = [];
        var i = 0.0;
        var format = new ol.format.WKT();
        for (var key in objects) {
            i++;
            if (objects[key]["http://www.w3.org/2003/01/geo/wgs84_pos#lat"] && objects[key]["http://www.w3.org/2003/01/geo/wgs84_pos#long"] && objects[key]["http://www.w3.org/2003/01/geo/wgs84_pos#lat"] != "" && objects[key]["http://www.w3.org/2003/01/geo/wgs84_pos#long"] != "") {
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
            if (objects[key]["http://www.opengis.net/ont/geosparql#asWKT"]) {
                var g_feature = format.readFeature(objects[key]['http://www.opengis.net/ont/geosparql#asWKT'].toUpperCase());
                objects[key].geometry = g_feature.getGeometry();
                objects[key].geometry.transform('EPSG:4326', options.projection);
                delete objects[key]['http://www.opengis.net/ont/geosparql#asWKT'];
                var coord = objects[key].geometry.getCoordinates();

                if (typeof occupied_xy[coord] !== 'undefined') continue;
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
        for (var categ in category_map) {
            category_map[categ].color = rainbow(category_id, category_map[categ].id, 0.7);
        }
        src.legend_categories = category_map;
        for (var i = 0; i < features.length; i++) {
            if (features[i].category_id) {
                features[i].color = rainbow(category_id, features[i].category_id, 0.7);
            }
        }
        return features;
    }

    return function(options) {
        var category_map = {};
        var category_id = 0;
        var occupied_xy = {};
        var src = new ol.source.Vector({
            format: new ol.format.GeoJSON(),
            loader: function(extent, resolution, projection) {
                this.set('loaded', false);
                if (typeof this.options.clear_on_move !== 'undefined' && this.options.clear_on_move) this.clear();
                if (typeof options.hsproxy == 'undefined') options.hsproxy = false;
                if (typeof options.geom_attribute == 'undefined') options.geom_attribute = 'bif:st_point(xsd:decimal(?lon), xsd:decimal(?lat))';
                if (this.options.url == '') return;
                var p = this.options.url;
                var first_pair = [extent[0], extent[1]];
                var second_pair = [extent[2], extent[3]];
                first_pair = ol.proj.transform(first_pair, 'EPSG:3857', 'EPSG:4326');
                second_pair = ol.proj.transform(second_pair, 'EPSG:3857', 'EPSG:4326');
                var extent = [first_pair[0], first_pair[1], second_pair[0], second_pair[1]];
                var s_extent = 'FILTER(bif:st_intersects(bif:st_geomfromtext("BOX(' + extent[0] + ' ' + extent[1] + ', ' + extent[2] + ' ' + extent[3] + ')"), ' + options.geom_attribute + ')).';
                p = p.replace("<extent>", s_extent);
                if (options.hsproxy)
                    p = "/cgi-bin/hsproxy.cgi?toEncoding=utf-8&url=" + encodeURIComponent(p);
                $.ajax({
                        url: p,
                        context: this
                    })
                    .done(function(response) {
                        if (this.options.updates_url) {
                            var updates_query = this.options.updates_url;
                            updates_query = updates_query.replace("<extent>", s_extent);
                            $.ajax({
                                    url: updates_query,
                                    context: this
                                })
                                .done(function(updates_response) {
                                    var objects = {};
                                    for (var i = 0; i < response.results.bindings.length; i++) {
                                        var b = response.results.bindings[i];
                                        if (typeof objects[b.o.value] === 'undefined') {
                                            objects[b.o.value] = {
                                                'poi_id': b.o.value
                                            };
                                        }
                                        objects[b.o.value][b.p.value] = b.s.value;
                                    }
                                    for (var i = 0; i < updates_response.results.bindings.length; i++) {
                                        var b = updates_response.results.bindings[i];
                                        objects[b.o.value][b.attr.value] = b.value.value;
                                    }

                                    this.addFeatures(loadFeatures(objects, this, options, occupied_xy, category_map, category_id));
                                    this.set('loaded', true);
                                })
                        } else {
                            var objects = {};
                            for (var i = 0; i < response.results.bindings.length; i++) {
                                var b = response.results.bindings[i];
                                if (typeof objects[b.o.value] === 'undefined') {
                                    objects[b.o.value] = {
                                        'poi_id': b.o.value
                                    };
                                }
                                objects[b.o.value][b.p.value] = b.s.value;
                            }

                            this.addFeatures(loadFeatures(objects, this, options, occupied_xy, category_map, category_id));
                            this.styleAble = true;
                            this.hasPoint = true;
                            this.set('loaded', true);
                        }
                    })
            },
            strategy: function(extent, resolution) {
                var tmp = [extent[0], extent[1], extent[2], extent[3]];
                if (extent[2] - extent[0] > 65735) {
                    tmp[0] = (extent[2] + extent[0]) / 2.0 - 65735 / 2.0;
                    tmp[2] = (extent[2] + extent[0]) / 2.0 + 65735 / 2.0;
                    tmp[1] = (extent[3] + extent[1]) / 2.0 - 35000 / 2.0;
                    tmp[3] = (extent[3] + extent[1]) / 2.0 + 35000 / 2.0;
                }
                return [tmp];
            },
            projection: options.projection
        });
        src.options = options;
        src.legend_categories = category_map;
        return src;
    };
});
