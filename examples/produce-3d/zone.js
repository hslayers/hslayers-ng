define(['ol'],

    function (ol) {
        var zones_source = new ol.source.Vector();
        var $scope;
        var $compile;
        var map;
        var utils;

        var stroke = new ol.style.Stroke({
            color: '#3399CC',
            width: 1.25
        });

        function entityClicked(entity) {
            $scope.showInfo(entity);
            if ($('#zone-info-dialog').length > 0) {
                angular.element('#zone-info-dialog').parent().remove();
            }
            var el = angular.element('<div hs.foodiezones.info-directive></div>');
            $("#hs-dialog-area").append(el);
            $compile(el)($scope);
        }

        zones_source.cesiumStyler = function (dataSource) {
            var entities = dataSource.entities.values;
            for (var i = 0; i < entities.length; i++) {
                var entity = entities[i];
                if (entity.styled) continue;
                var name = entity.properties.label;
                var crop = entity.properties.crop.getValue().split('/');
                crop = parseInt(crop[crop.length - 1]);
                entity.polygon.outline = false;
                entity.polygon.material = new Cesium.Color.fromCssColorString(utils.rainbow(30, crop, 0.7));
                entity.styled = true;
                entity.label = new Cesium.LabelGraphics({
                    text:  entity.properties['crop description'].getValue() + '\n' + entity.properties['management zone'].getValue().split('core/')[1],
                    font: '18px Helvetica',
                    fillColor: Cesium.Color.WHITE,
                    outlineColor: new Cesium.Color(0.64, 0.1725490, 0.749019, 0.9),
                    outlineWidth: 2,
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    pixelOffset: new Cesium.Cartesian2(0, -36),
                    //scaleByDistance: new Cesium.NearFarScalar(50, 1.5, 15000, 0.0),
                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
                }); 
                entity.onclick = entityClicked
            }
        }

        var me = {
            get: function () {
                //if(map.getView().getResolution() > 2.48657133911758) return;
                var format = new ol.format.WKT();
                var bbox = map.getView().calculateExtent(map.getSize());
                var ext = bbox;
                var extents = ext[0] + ' ' + ext[1] + ', ' + ext[2] + ' ' + ext[3];
                var q = 'https://www.foodie-cloud.org/sparql?default-graph-uri=&query=' + encodeURIComponent(`PREFIX geo: <http://www.opengis.net/ont/geosparql#> 
                   PREFIX geof: <http://www.opengis.net/def/function/geosparql/> 
                   PREFIX virtrdf: <http://www.openlinksw.com/schemas/virtrdf#>  PREFIX foodie: <http://foodie-cloud.com/model/foodie#>
                   PREFIX foodie-es: <http://foodie-cloud.com/model/foodie-es#>
                   prefix iso19103: <http://def.seegrid.csiro.au/isotc211/iso19103/2005/basic#> 
                   SELECT * FROM <http://w3id.org/foodie/core/es#> WHERE {
                   ?z a foodie:ManagementZone. 
                   ?z foodie:cropSpecies ?crop.
                   ?z <http://www.opengis.net/ont/geosparql#hasGeometry> ?geom.
                   ?geom <http://www.opengis.net/ont/geosparql#asWKT> ?wkt.
                   ?prod foodie-es:productionTypeManagementZone ?z.
                   ?crop foodie:description ?crop_desc .
                   ?crop foodie:family ?crop_family .
                   ?crop foodie:genus ?crop_genus .
                   ?crop foodie:species ?crop_species .
                   ?crop foodie:variety ?crop_variety .
                   ?prod foodie-es:productionTypeManagementZone ?mzone .
                   ?prod a foodie:ProductionType .
                   ?prod foodie:productionDate ?prod_date .
                   ?prod foodie:productionAmount ?amount .
                   ?amount iso19103:uom ?amount_unit .
                   ?amount iso19103:value ?amount_value .
                   }`) + '&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on';

                zones_source.set('loaded', false);
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
                                    var feature = new ol.Feature({
                                        geometry: geom_transformed,
                                        crop: b.crop.value,
                                        'crop description': b.crop_desc.value,
                                        'crop family': b.crop_family.value,
                                        'management zone': b.z.value,
                                        'production date': b.prod_date.value,
                                        amount: parseFloat(b.amount_value.value) + ' ' + b.amount_unit.value
                                    });
                                    features.push(feature);
                                }
                            } catch (ex) {
                                console.log(ex);
                            }
                        }
                        zones_source.clear();
                        zones_source.addFeatures(features);
                        zones_source.set('loaded', true);
                        zones_source.dispatchEvent('features:loaded', zones_source);
                    })
            },
            createLayer: function () {
                return new ol.layer.Vector({
                    title: "Management zones colored by crop type",
                    source: zones_source,
                    visible: true,
                    style: function (feature, resolution) {
                        var crop = feature.get('crop').split('/');
                        crop = crop[crop.length - 1];
                        var fill = new ol.style.Fill({
                            color: utils.rainbow(30, crop, 0.7)
                        });
                        return [
                            new ol.style.Style({
                                image: new ol.style.Circle({
                                    fill: fill,
                                    stroke: stroke,
                                    radius: 5
                                }),
                                text: new ol.style.Text({
                                    font: '12px helvetica,sans-serif',
                                    text: feature.get('crop description') + '\n' + feature.get('management zone').split('core/')[1],
                                    fill: new ol.style.Fill({
                                        color: '#000'
                                    }),
                                    stroke: new ol.style.Stroke({
                                        color: '#fff',
                                        width: 3
                                    })
                                })
                                ,
                                fill: fill,
                                stroke: stroke
                            })
                        ];
                    },
                })
            },
            describeZone: function (id, callback) {
                var q = 'https://www.foodie-cloud.org/sparql?default-graph-uri=&query=' + encodeURIComponent('describe <' + id + '>') + '&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on';
                $.ajax({
                    url: utils.proxify(q)
                })
                    .done(function (response) {
                        if (angular.isUndefined(response.results)) return;
                        for (var i = 0; i < response.results.bindings.length; i++) {
                            var b = response.results.bindings[i];
                            var short_name = b.p.value;
                            if (short_name.indexOf('#') > -1)
                                short_name = short_name.split('#')[1];
                            $scope.zone.attributes.push({ short_name: short_name, value: b.o.value });
                        }
                        $scope.getLinksTo(id, callback);
                    })
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
