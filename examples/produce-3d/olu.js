define(['ol'],

    function (ol) {
        var olus_source = new ol.source.Vector();
        var $scope;
        var $compile;
        var map;
        var utils;
        var olus_lyr;

        function entityClicked(entity) {
            $scope.showInfo(entity);
            if ($('#zone-info-dialog').length > 0) {
                angular.element('#zone-info-dialog').parent().remove();
            }
            var el = angular.element('<div hs.foodiezones.info-directive></div>');
            $("#hs-dialog-area").append(el);
            $compile(el)($scope);
        }

        olus_source.cesiumStyler = function (dataSource) {
            var entities = dataSource.entities.values;
            for (var i = 0; i < entities.length; i++) {
                var entity = entities[i];
                if (entity.styled) continue;
                var name = entity.properties.label;
                var use = parseInt(entity.properties.use.getValue());
                entity.polygon.outline = false;
                entity.polygon.material = new Cesium.Color.fromCssColorString( utils.rainbow(350, use, 0.1));
                entity.styled = true;
                //entity.onclick = entityClicked
            }
        }

        var me = {
            get: function () {
                if (map.getView().getResolution() > 2.48657133911758 || olus_lyr.getVisible()==false) return;
                var format = new ol.format.WKT();
                var bbox = map.getView().calculateExtent(map.getSize());
                var ext = bbox;
                var extents = ext[0] + ' ' + ext[1] + ', ' + ext[2] + ' ' + ext[3];
                var q = 'https://www.foodie-cloud.org/sparql?default-graph-uri=&query=' + encodeURIComponent(`PREFIX geo: <http://www.opengis.net/ont/geosparql#> 
                PREFIX geof: <http://www.opengis.net/def/function/geosparql/> 
                PREFIX virtrdf: <http://www.openlinksw.com/schemas/virtrdf#> 
                PREFIX poi: <http://www.openvoc.eu/poi#> 
                PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> 
                SELECT ?o ?wkt ?use 
                    FROM <http://w3id.org/foodie/olu#> 
                    WHERE { ?o geo:hasGeometry ?geometry. 
                        ?geometry geo:asWKT ?wkt. 
                        FILTER(bif:st_intersects(bif:st_geomfromtext("BOX(${extents})"), ?wkt)). 
                        ?o <http://w3id.org/foodie/olu#specificLandUse> ?use. 
                    }   
                `) + '&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on';

                olus_source.set('loaded', false);
                $.ajax({
                    url: utils.proxify(q)
                })
                    .done(function (response) {
                        if (angular.isUndefined(response.results)) return;
                        var features = [];
                        for (var i = 0; i < response.results.bindings.length; i++) {
                            try {
                                var b = response.results.bindings[i];
                                if (b.wkt.datatype == "http://www.openlinksw.com/schemas/virtrdf#Geometry" && b.wkt.value.indexOf('e+') == -1 && b.wkt.value.indexOf('e-') == -1) {
                                    var g_feature = format.readFeature(b.wkt.value.toUpperCase());
                                    var ext = g_feature.getGeometry().getExtent()
                                    var geom_transformed = g_feature.getGeometry().transform('EPSG:4326', map.getView().getProjection());
                                    var feature = new ol.Feature({ geometry: geom_transformed, parcel: b.o.value, use: b.use.value });
                                    features.push(feature);
                                }
                            } catch (ex) {
                                console.log(ex);
                            }
                        }
                        olus_source.clear();
                        olus_source.addFeatures(features);
                        olus_source.set('loaded', true);
                        olus_source.dispatchEvent('features:loaded', olus_source);
                    })
            },
            createOluLayer: function () {
                olus_lyr = new ol.layer.Vector({
                    title: "Open land use parcels",
                    source: olus_source,
                    visible: false,
                    style: function (feature, resolution) {
                        var use = feature.get('use').split('/');
                        use = use[use.length - 1];
                        return [
                            new ol.style.Style({
                                stroke: new ol.style.Stroke({
                                    color: utils.rainbow(350, use, 0.8),
                                    width: 2
                                })
                            })
                        ];
                    }
                });
                return olus_lyr;
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
