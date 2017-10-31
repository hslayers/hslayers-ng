define(['ol'],

    function (ol) {
        var olu_source = new ol.source.Vector();
        var $scope;
        var $compile;
        var greenery = ["27", "10", "19"];
        var last_position_loaded = [0, 0];
        var last_map_calculated = 0;
        var map;
        var utils;

        function entityClicked(entity) {
            $scope.showInfo(entity);
            if ($('#zone-info-dialog').length > 0) {
                angular.element('#zone-info-dialog').parent().remove();
            }
            var el = angular.element('<div hs.foodiezones.info-directive></div>');
            $("#hs-dialog-area").append(el);
            $compile(el)($scope);
        }

        olu_source.cesiumStyler = function (dataSource) {
            var entities = dataSource.entities.values;
            for (var i = 0; i < entities.length; i++) {
                var entity = entities[i];
                if (entity.styled) continue;
                var name = entity.properties.label;
                var s = entity.properties.use.getValue();
                entity.polygon.outline = false;
                if (greenery.indexOf(s) > -1)
                    entity.polygon.material = Cesium.Color.GREEN.withAlpha(0.4);
                else
                    switch (s) {
                        case "17":
                            entity.polygon.material = Cesium.Color.WHITE.withAlpha(0.2);
                            break;
                        case "13":
                            entity.polygon.material = new Cesium.Color(0.9, 0.1725490, 0.149019, 0.2);
                            break;
                        default:
                            entity.polygon.material = new Cesium.Color(1, 1, 1, 0.09);

                    }
                entity.styled = true;
                //entity.onclick = entityClicked
            }
        }

        var me = {
            updMap: function (timestamp, pos_lon_lat) {
                if (timestamp - last_map_calculated < 500) return;
                last_map_calculated = timestamp;
                var diff = { x: pos_lon_lat[0] - last_position_loaded[0], y: pos_lon_lat[1] - last_position_loaded[1] };
                if (last_map_calculated == [0, 0] || Math.sqrt(diff.x * diff.x + diff.y * diff.y) > 0.002 * 0.8) {
                    me.getOlus(pos_lon_lat);
                    last_position_loaded = [pos_lon_lat[0], pos_lon_lat[1]];
                }
            },
            getOlus: function (c) {
                var format = new ol.format.WKT();
                var ver_off = 0.002;
                var hor_off = 0.002;
                var ol_extent = [c[0] - hor_off, c[1] - ver_off, c[0] + hor_off, c[1] + ver_off];
                //console.log('remove ol features', (new Date()).getTime()); window.lasttime = (new Date()).getTime();
                olu_source.getFeatures().forEach(function (feature) {
                    if (!feature.getGeometry().intersectsExtent(ol_extent)) {
                        var format = new ol.format.WKT();
                        //console.log('Removing feature ', feature.getId());
                        //console.log(format.writeGeometry(feature.getGeometry()), format.writeGeometry(ol.geom.Polygon.fromExtent(ol_extent)));
                        olu_source.removeFeature(feature);
                    }
                })
                //console.log('done', (new Date()).getTime() - window.lasttime); window.lasttime = (new Date()).getTime();
                var extents = `POLYGON ((${c[0] - hor_off} ${c[1] - ver_off}, ${c[0] - hor_off} ${c[1] + ver_off}, ${c[0] + hor_off} ${c[1] + ver_off}, ${c[0] + hor_off} ${c[1] - ver_off}, ${c[0] - hor_off} ${c[1] - ver_off}))`;
                var q = 'https://www.foodie-cloud.org/sparql?default-graph-uri=&query=' + encodeURIComponent(`PREFIX geo: <http://www.opengis.net/ont/geosparql#> 
                PREFIX geof: <http://www.opengis.net/def/function/geosparql/> 
                PREFIX virtrdf: <http://www.openlinksw.com/schemas/virtrdf#> 
                PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> 
                SELECT ?o ?wkt ?use 
                FROM <http://w3id.org/foodie/olu#> 
                WHERE { ?o geo:hasGeometry ?geometry. 
                    ?geometry geo:asWKT ?wkt. 
                    FILTER(bif:st_intersects(bif:st_geomfromtext("${extents}"), ?wkt)).
                    ?o <http://w3id.org/foodie/olu#specificLandUse> ?use. 
                    FILTER(?use!="17"^^xsd:string)
                }`) + '&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on';

                olu_source.set('loaded', false);
                $.ajax({
                    url: utils.proxify(q)
                })
                    .done(function (response) {
                        if (angular.isUndefined(response.results)) return;
                        //console.log('got it', (new Date()).getTime() - window.lasttime); window.lasttime = (new Date()).getTime();
                        var features = [];
                        for (var i = 0; i < response.results.bindings.length; i++) {
                            try {
                                var b = response.results.bindings[i];
                                if (b.wkt.datatype == "http://www.openlinksw.com/schemas/virtrdf#Geometry" && b.wkt.value.indexOf('e+') == -1 && b.wkt.value.indexOf('e-') == -1) {
                                    if (olu_source.getFeatureById(b.o.value) == null) {
                                        var g_feature = format.readFeature(b.wkt.value.toUpperCase());
                                        var ext = g_feature.getGeometry().getExtent()
                                        var geom_transformed = g_feature.getGeometry().transform('EPSG:4326', map.getView().getProjection());
                                        var feature = new ol.Feature({ geometry: geom_transformed, olu: b.o.value, use: b.use.value });
                                        feature.setId(b.o.value);
                                        features.push(feature);
                                    }
                                }
                            } catch (ex) {
                                //console.log(ex);
                            }
                        }
                        //olu_source.clear();
                        olu_source.addFeatures(features);
                        olu_source.set('loaded', true);
                        //console.log('ol features added', (new Date()).getTime() - window.lasttime); window.lasttime = (new Date()).getTime();
                        olu_source.dispatchEvent('features:loaded', olu_source);
                    })
            },
            createOluLayer: function () {
                return new ol.layer.Vector({
                    title: "Open land use parcels",
                    source: olu_source,
                    visible: true
                })
            },
            getOluUnder: function (cord) {
                var features = olu_source.getFeaturesAtCoordinate(cord);
                return features.map((f) => f.get('use'));
            },
            getSpeed: function (cord) {
                var speed = 0.0002;
                me.getOluUnder(cord).forEach(function (use) {
                    if (use == '13') speed = 0;
                    if (greenery.indexOf(use) > -1) speed = 0.00015;
                });
                return speed;
            },
            init: function (_$scope, _$compile, _map, _utils) {
                $scope = _$scope;
                $compile = _$compile;
                map = _map;
                utils = _utils;
            }
        }
        return me;
    }
)
