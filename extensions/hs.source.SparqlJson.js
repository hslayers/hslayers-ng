define(function(require) {
    var ol = require('ol');
    return function(options) {
        var src = new ol.source.ServerVector({
            format: new ol.format.GeoJSON(),
            loader: function(extent, resolution, projection) {
                        src.clear();
                var p = options.url;

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
                        for(var key in objects){
                            i++;
                            if(objects[key]["http://www.w3.org/2003/01/geo/wgs84_pos#long"] && objects[key]["http://www.w3.org/2003/01/geo/wgs84_pos#long"] && objects[key]["http://www.w3.org/2003/01/geo/wgs84_pos#lat"]!="" && objects[key]["http://www.w3.org/2003/01/geo/wgs84_pos#long"]!=""){
                                var x = parseFloat(objects[key]["http://www.w3.org/2003/01/geo/wgs84_pos#long"]);
                                var y = parseFloat(objects[key]["http://www.w3.org/2003/01/geo/wgs84_pos#lat"]);
                                if(!isNaN(x) && !isNaN(y)){
                                    objects[key].geometry = new ol.geom.Point(ol.proj.transform([x, y],'EPSG:4326', 'EPSG:3857'));
                                    var feature = new ol.Feature(objects[key]);
                                    features.push(feature);
                                }
                            }
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