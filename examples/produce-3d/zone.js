define(['ol'],

    function (ol) {
        var zones_source = new ol.source.Vector();
        var $scope;
        var $compile;
        var map;
        var utils;
        var viewer;

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
                function fillExtrudedHeight() {
                    return (this.entity.properties.height || 0) + this.entity.properties.numerical_amount / 100
                }
                function fillHeight() {
                    return this.entity.properties.height || 0
                }
                var cbp = new Cesium.CallbackProperty(fillHeight, false);
                var cbpex = new Cesium.CallbackProperty(fillExtrudedHeight, false);
                entity.polygon.extrudedHeight = cbpex;
                cbp.entity = entity;
                cbpex.entity = entity;
                entity.polygon.height = cbp;
                entity.styled = true;
                var polyPositions = entity.polygon.hierarchy.getValue(Cesium.JulianDate.now()).positions;
                var polyCenter = Cesium.BoundingSphere.fromPoints(polyPositions).center;
                polyCenter = Cesium.Ellipsoid.WGS84.scaleToGeodeticSurface(polyCenter);
                entity.position = polyCenter;
                var cartoPos = Cesium.Cartographic.fromCartesian(polyCenter);
                cartoPos.entity = entity;
                var promise = Cesium.sampleTerrainMostDetailed(viewer.terrainProvider, [
                    cartoPos
                ]);
                Cesium.when(promise, function (updatedPositions) {
                    updatedPositions[0].entity.properties.height = updatedPositions[0].height;
                    updatedPositions[0].entity.polygon.height.setCallback(fillHeight, true);
                    updatedPositions[0].entity.polygon.extrudedHeight.setCallback(fillExtrudedHeight, true);
                });
                entity.label = {
                    text: entity.properties['crop description'].getValue() + '\n' + entity.properties['management zone'].getValue().split('core/')[1],
                    font: '18px Helvetica',
                    showBackground: true,
                    horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    distanceDisplayCondition: new Cesium.DistanceDisplayCondition(10.0, 8000.0),
                    disableDepthTestDistance: Number.POSITIVE_INFINITY,
                    scaleByDistance: new Cesium.NearFarScalar(50, 1, 20000, 0.0),
                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
                };
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
                   SELECT * 
                   FROM <http://w3id.org/foodie/core/es#> 
                   FROM <http://w3id.org/foodie/core/es-mappings#> WHERE {
                   ?z a foodie:ManagementZone. 
                   ?z foodie:cropSpecies ?crop.
                   ?z <http://www.opengis.net/ont/geosparql#hasGeometry> ?geom.
                   ?geom <http://www.opengis.net/ont/geosparql#asWKT> ?wkt.
                   ?prod foodie-es:productionTypeManagementZone ?z.
                   ?z foodie-es:managementZoneName ?zone_name.
                   ?crop foodie:description ?crop_desc .
                   ?crop foodie:family ?crop_family .
                   ?crop foodie:genus ?crop_genus .
                   ?crop foodie:species ?crop_species .
                   ?crop foodie:variety ?crop_variety .
                   ?crop <http://schema.org/image> ?image.
                   ?prod foodie-es:productionTypeManagementZone ?mzone .
                   ?prod a foodie:ProductionType .
                   ?crop <http://www.w3.org/2002/07/owl#sameAs> ?species_same_as.
                   filter contains(str(?species_same_as), "http://dbpedia.org").     
                   ?prod foodie:productionDate ?prod_date .
                   ?prod foodie-es:productionTypeCampaignType ?campaign_type.
                   ?campaign_type foodie-es:campaignBegin ?campaign_begin.
                   ?campaign_type foodie-es:campaignEnd ?campaign_end.
                   ?prod foodie:productionAmount ?amount .
                   ?amount iso19103:uom ?amount_unit .
                   ?amount iso19103:value ?amount_value .
                   }`) + '&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on';

                zones_source.set('loaded', false);
                $.ajax({
                    url: q
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
                                        prod: b.prod.value,
                                        image: b.image.value,
                                        campaign_begin: b.campaign_begin.value,
                                        campaign_end: b.campaign_end.value,
                                        crop_dbpedia: b.species_same_as.value,
                                        'production date': b.prod_date.value,
                                        'zone_name': b.zone_name.value,
                                        amount: parseFloat(b.amount_value.value) + ' ' + b.amount_unit.value,
                                        numerical_amount: parseFloat(b.amount_value.value)
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
            createLayer: function (gettext) {
                return new ol.layer.Vector({
                    title: gettext("Management zones colored by crop type"),
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
            init: function (_$scope, _$compile, _map, _utils, _viewer) {
                $scope = _$scope;
                $compile = _$compile;
                map = _map;
                utils = _utils;
                viewer = _viewer;
            }
        }
        return me;
    }
)
