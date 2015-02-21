define(function(require) {
    var ol = require('ol');
    return function(options) {
        var src = new ol.source.ServerVector({
            format: new ol.format.GeoJSON(),    
            loader: function(extent, resolution, projection) {
                if(src.loaded) return;
                        src.clear();
                var p = options.url;
src.loaded = true;
                $.ajax({
                       url: p
                    })
                    .done(function(response) {
                        
                        var objects = {};
                        for(var i = 0; i<response.results.bindings.length;i++){
                            var b = response.results.bindings[i];
                            if (typeof objects[b.o.value] === 'undefined'){
                                objects[b.o.value] = {};
                            }
                            objects[b.o.value][b.p.value] = b.s.value;
                        }
                        var features = [];
                        var i=0.0;
                        var category_map = {};
                        var category_id = 0;
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
                        for(var key in objects){
                            i++;
                            if(objects[key]["http://www.w3.org/2003/01/geo/wgs84_pos#long"] && objects[key]["http://www.w3.org/2003/01/geo/wgs84_pos#long"] && objects[key]["http://www.w3.org/2003/01/geo/wgs84_pos#lat"]!="" && objects[key]["http://www.w3.org/2003/01/geo/wgs84_pos#long"]!=""){
                                var x = parseFloat(objects[key]["http://www.w3.org/2003/01/geo/wgs84_pos#long"]);
                                var y = parseFloat(objects[key]["http://www.w3.org/2003/01/geo/wgs84_pos#lat"]);
                                if(!isNaN(x) && !isNaN(y)){
                                    objects[key].geometry = new ol.geom.Point(ol.proj.transform([x, y],'EPSG:4326', 'EPSG:3857'));
                                    var feature = new ol.Feature(objects[key]);
                                    if(objects[key]["http://gis.zcu.cz/poi#category"]){
                                        if(typeof category_map[objects[key]["http://gis.zcu.cz/poi#category"]] === 'undefined'){
                                            category_map[objects[key]["http://gis.zcu.cz/poi#category"]] = category_id;
                                            category_id++;
                                        }
                                        feature.category_id = category_map[objects[key]["http://gis.zcu.cz/poi#category"]];
                                    }
                                    features.push(feature);
                                }
                            }
                        }
                        for(var i = 0; i< features.length; i++){
                            features[i].color = rainbow(category_id, features[i].category_id, 0.7);
                        }
                        src.addFeatures(features);
                    });
            },
            strategy: ol.loadingstrategy.all,
            projection: options.projection
        });
        return src;
    };
});