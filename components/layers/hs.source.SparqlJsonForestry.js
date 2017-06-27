define(['ol'], function (ol) {
    return function(options) {
        var category_map = {};
        var category_id = 0;
        var occupied_xy = {};
        var src = new ol.source.Vector({
            format: new ol.format.GeoJSON(),
            loader: function(extent, resolution, projection) {
                if (typeof src.options.clear_on_move !== 'undefined' && src.options.clear_on_move) src.clear();
                if (typeof options.hsproxy == 'undefined') options.hsproxy = false;
                if (src.options.url == '') return;
                var p = src.options.url;
                if (options.hsproxy)
                    p = "/cgi-bin/hsproxy.cgi?toEncoding=utf-8&url=" + encodeURIComponent(p);

                function getPrecision(scinum) {
                    var arr = new Array();
                    // Get the exponent after 'e', make it absolute.  
                    arr = scinum.split('e');
                    var exponent = Math.abs(arr[1]);

                    // Add to it the number of digits between the '.' and the 'e'
                    // to give our required precision.
                    var precision = new Number(exponent);
                    arr = arr[0].split('.');
                    precision += arr[1].length;

                    return precision;
                }

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
                            if (b.s.datatype && b.s.datatype == 'http://www.w3.org/2001/XMLSchema#double') {
                                objects[b.o.value][b.p.value] = parseFloat(b.s.value).toFixed(2);
                            } else {
                                objects[b.o.value][b.p.value] = b.s.value;
                            }
                            /*
                            objects[b.o.value].geom = b.geom.value;
                            objects[b.o.value].value = b.value.value;
                            objects[b.o.value].nut = b.nut.value;
                            */
                            if (b.p.value == options.value_attr) {
                                if (min > parseFloat(b.s.value)) min = parseFloat(objects[b.o.value][b.p.value]);
                                if (max < parseFloat(b.s.value)) max = parseFloat(objects[b.o.value][b.p.value]);
                            }
                        }
                        var features = [];
                        var i = 0.0;
                        var green = function(numOfSteps, step, opacity) {

                            var a = [
                                '228, 251, 203',
                                '198, 229, 171',
                                '168, 208, 140',
                                '139, 187, 109',
                                '109, 165, 77',
                                '79, 144, 46',
                                '50, 123, 15', '44, 110, 13'
                            ]

                            return 'rgba(' + a[step] + ', 0.7)';
                        }
                        var step = (max - min) / 7.0;
                        for (var c = 0; c <= 7; c++) {
                            var l_bound = parseFloat((min + c * step));
                            var u_bound = parseFloat(min + (c + 1.0) * step);

                            category_map[c] = {
                                name: l_bound.toFixed(2) + " - " + u_bound.toFixed(2),
                                color: green(7, c, 1)
                            };
                        }

                        for (var key in objects) {
                            i++;
                            if (objects[key][options.geometry_attr]) {
                                var format = new ol.format.WKT();
                                var g_feature = format.readFeature(objects[key][options.geometry_attr]);
                                objects[key].geometry = g_feature.getGeometry();
                                objects[key].geometry.transform('EPSG:4326', options.projection);
                                delete objects[key][options.geometry_attr];
                                var feature = new ol.Feature(objects[key]);
                                feature.color = green(7, parseInt((objects[key][options.value_attr] - min) / ((max - min) / 7)), 1);
                                features.push(feature);
                            }
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
