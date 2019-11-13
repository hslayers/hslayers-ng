import { WKT, GeoJSON } from 'ol/format';
import { transform, transformExtent, get as getProj } from 'ol/proj';
import { Polygon, LineString, GeometryType, Point } from 'ol/geom';
import Feature from 'ol/Feature';
import { Vector } from 'ol/source';
import * as loadingstrategy from 'ol/loadingstrategy';

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

function registerCategoryForStatistics(feature_object, options, feature, category_map, category_id) {
    if (feature_object[options.category_field]) {
        if (typeof category_map[feature_object[options.category_field]] === 'undefined') {
            category_map[feature_object[options.category_field]] = {
                id: category_id,
                name: feature_object[options.category_field]
            };
            category_id++;
        }
        feature.category_id = category_map[feature_object[options.category_field]].id;
    }
}

function loadFeatures(objects, src, options, occupied_xy, category_map, category_id) {
    var features = [];
    var format = new WKT();
    for (var key in objects) {
        if (objects[key]["http://www.w3.org/2003/01/geo/wgs84_pos#lat"] && objects[key]["http://www.w3.org/2003/01/geo/wgs84_pos#long"] && objects[key]["http://www.w3.org/2003/01/geo/wgs84_pos#lat"] != "" && objects[key]["http://www.w3.org/2003/01/geo/wgs84_pos#long"] != "") {
            var x = parseFloat(objects[key]["http://www.w3.org/2003/01/geo/wgs84_pos#long"]);
            var y = parseFloat(objects[key]["http://www.w3.org/2003/01/geo/wgs84_pos#lat"]);
            if (!isNaN(x) && !isNaN(y)) {
                var coord = transform([x, y], 'EPSG:4326', 'EPSG:3857');
                if (typeof occupied_xy[coord] !== 'undefined') continue;
                objects[key].geometry = new Point(coord);
                var feature = new Feature(objects[key]);
                registerCategoryForStatistics(objects[key], options, feature, category_map, category_id);
                occupied_xy[coord] = true;
                features.push(feature);
            }
        }
        if (objects[key]["http://www.opengis.net/ont/geosparql#asWKT"]) {
            console.log("foo");
            var g_feature = format.readFeature(objects[key]['http://www.opengis.net/ont/geosparql#asWKT'].toUpperCase());
            objects[key].geometry = g_feature.getGeometry();
            objects[key].geometry.transform('EPSG:4326', options.projection);
            delete objects[key]['http://www.opengis.net/ont/geosparql#asWKT'];
            var coord = objects[key].geometry.getCoordinates();

            if (typeof occupied_xy[coord] !== 'undefined') continue;
            var feature = new Feature(objects[key]);
            registerCategoryForStatistics(objects[key], options, feature, category_map, category_id);
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
    console.log(features);
    return features;
}

function extendAttributes(options, objects) {
    if (typeof options.extend_with_attribs != 'undefined') {
        for (var attr_i in options.extend_with_attribs) {
            for (var i in objects) {
                if (typeof objects[i][options.extend_with_attribs[attr_i]] == 'undefined') {
                    objects[i][options.extend_with_attribs[attr_i]] = '';
                }
            }
        }
    }
}

var $http = angular.injector(["ng"]).get("$http");

export default function (options) {
    var category_map = {};
    var category_id = 0;
    var occupied_xy = {};
    var src = new Vector({
        format: new GeoJSON(),
        loader: function (extent, resolution, projection) {
            this.set('loaded', false);
            if (typeof this.options.clear_on_move !== 'undefined' && this.options.clear_on_move) this.clear();
            if (typeof options.hsproxy == 'undefined') options.hsproxy = false;
            if (typeof options.geom_attribute == 'undefined') options.geom_attribute = 'bif:st_point(xsd:decimal(?lon), xsd:decimal(?lat))';
            if (this.options.url == '') return;
            var p = this.options.url;
            var first_pair = [extent[0], extent[1]];
            var second_pair = [extent[2], extent[3]];
            first_pair = transform(first_pair, 'EPSG:3857', 'EPSG:4326');
            second_pair = transform(second_pair, 'EPSG:3857', 'EPSG:4326');
            var extent = [first_pair[0], first_pair[1], second_pair[0], second_pair[1]];
            var s_extent = encodeURIComponent('FILTER(geof:sfIntersects("POLYGON((' +
                extent[0] + ' ' + extent[1] + ', ' +
                extent[0] + ' ' + extent[3] + ', ' +
                extent[2] + ' ' + extent[3] + ', ' +
                extent[2] + ' ' + extent[1] + ', ' +
                extent[0] + ' ' + extent[1] +
                '))"^^geo:wktLiteral, ' + options.geom_attribute + ')).');
            let tmp = p.split("&query=");
            p = tmp[0] + "&query=" +
                encodeURIComponent("PREFIX geo: <http://www.opengis.net/ont/geosparql#>\n" +
                "PREFIX geof: <http://www.opengis.net/def/function/geosparql/>\n") + tmp[1];
            p = p.replace("<extent>", s_extent);
            if (options.hsproxy)
                p = "/cgi-bin/hsproxy.cgi?toEncoding=utf-8&url=" + encodeURIComponent(p);
            if (console && typeof src.get('geoname') != 'undefined') console.log('Get ', src.get('geoname'));
            this.loadCounter += 1;
            this.loadTotal += 1;
            $http({url: p})
                .then((response) => {
                    if (console)
                        console.log('Finish ', this.get('geoname'), response.data.results.bindings.length);
                    src.loadCounter -= 1;
                    if (this.options.updates_url) {
                        var updates_query = this.options.updates_url;
                        let tmp = updates_query.split("&query=");
                        updates_query = tmp[0] + "&query=" +
                            encodeURIComponent("PREFIX geo: <http://www.opengis.net/ont/geosparql#>\n" +
                            "PREFIX geof: <http://www.opengis.net/def/function/geosparql/>\n") + tmp[1];
                        updates_query = updates_query.replace("<extent>", s_extent);
                        src.loadCounter += 1;
                        src.loadTotal += 1;
                        var $injector = angular.injector(['ng']);
                        var $http = $injector.get('$http');
                        $http({url: updates_query})
                            .then(updates_response => {
                                if (console && typeof this.get('geoname') != 'undefined')
                                    console.log('Finish updates ', this.get('geoname'), response.data.results.bindings.length, updates_response.data.results.bindings.length);
                                let objects = {};
                                for (const item of response.data.results.bindings) {
                                    if (typeof objects[item.o.value] === 'undefined') {
                                        objects[item.o.value] = {
                                            'poi_id': item.o.value
                                        };
                                    }
                                    objects[item.o.value][item.p.value] = item.s.value;
                                }
                                for (const item of updates_response.data.results.bindings) {
                                    let attribute_name = item.attr.value;
                                    //Because photos can be more than one
                                    if (typeof objects[item.o.value][attribute_name] != 'undefined' && attribute_name == 'http://xmlns.com/foaf/0.1/depiction') {
                                        for (let try_i = 1; try_i < 20; try_i++) {
                                            if (typeof objects[item.o.value][attribute_name + try_i] == 'undefined') {
                                                attribute_name = attribute_name + try_i;
                                                break;
                                            }
                                        }
                                    }
                                    objects[item.o.value][attribute_name] = item.value.value;
                                }
                                if (typeof options.category != 'undefined') {
                                    for (let i in objects) {
                                        objects[i]['http://www.sdi4apps.eu/poi/#mainCategory'] = options.category;
                                    }
                                }
                                extendAttributes(options, objects);
                                if (console) {
                                    console.log('Add features', objects)
                                }
                                this.addFeatures(loadFeatures(objects, this, options, occupied_xy, category_map, category_id));
                                src.loadCounter -= 1;
                                this.set('last_feature_count', Object.keys(objects).length);
                                if (src.loadCounter == 0) {
                                    this.set('loaded', true);
                                    this.dispatchEvent('imageloadend');
                                }
                            })
                    } else {
                        var objects = {};
                        for (var i = 0; i < response.data.results.bindings.length; i++) {
                            var b = response.data.results.bindings[i];
                            if (typeof objects[b.o.value] === 'undefined') {
                                objects[b.o.value] = {
                                    'poi_id': b.o.value
                                };
                            }
                            objects[b.o.value][b.p.value] = b.s.value;
                        }
                        if (typeof options.category != 'undefined') {
                            for (var i in objects) {
                                objects[i]['http://www.sdi4apps.eu/poi/#mainCategory'] = options.category;
                            }
                        }
                        extendAttributes(options, objects);
                        this.addFeatures(loadFeatures(objects, this, options, occupied_xy, category_map, category_id));
                        this.styleAble = true;
                        this.hasPoint = true;
                        src.loadCounter -= 1;
                        this.set('last_feature_count', Object.keys(objects).length);
                        if (src.loadCounter == 0) {
                            this.set('loaded', true);
                            this.dispatchEvent('imageloadend');
                        }
                    }
                })
        },
        strategy: options.strategy || function (extent, resolution) {
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
    src.loadCounter = 0;
    src.loadTotal = 0;
    src.options = options;
    src.legend_categories = category_map;
    console.log("src");
    console.log(src);
    return src;
};
