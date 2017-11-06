define(['ol'],

    function (ol) {
        var olu_source = new ol.source.Vector();
        var $scope;
        var $compile;
        var greenery = ["27", "19"];
        var last_position_loaded = null;
        var last_map_calculated = 0;
        var map;
        var utils;
        var direction_changed = false;
        var character;
        var view_sector = null;

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
                        case "10":
                            entity.polygon.material = Cesium.Color.BLUE.withAlpha(0.4);
                            break;
                        case "13":
                            entity.polygon.material = new Cesium.Color(1, 162 / 255, 140 / 255, 1);
                            var cbp = new Cesium.CallbackProperty(function () {
                                return this.entity.properties.height || 0
                            }, false);
                            var cbpex = new Cesium.CallbackProperty(function () {
                                return (this.entity.properties.height || 0) + 5.0
                            }, false);
                            entity.polygon.extrudedHeight = cbpex;
                            cbp.entity = entity;
                            cbpex.entity = entity;
                            entity.polygon.height = cbp;
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
                            });
                            break;
                        default:
                            entity.polygon.material = new Cesium.Color(1, 1, 1, 0.09);

                    }
                entity.styled = true;
                //entity.onclick = entityClicked
            }
        }

        function createViewSector(pnts) {
            if (view_sector != null)
                viewer.scene.primitives.remove(view_sector);
            var rectangleInstance = new Cesium.GeometryInstance({
                geometry: new Cesium.PolygonGeometry({
                    polygonHierarchy: new Cesium.PolygonHierarchy(Cesium.Cartesian3.fromDegreesArray(pnts))
                }),
                attributes: {
                    color: new Cesium.ColorGeometryInstanceAttribute(0.0, .6, .8, 0.3)
                }
            });
            view_sector = viewer.scene.primitives.add(new Cesium.GroundPrimitive({
                geometryInstances: rectangleInstance
            }));
        }

        function generateViewSectorPoints(c) {
            var target = character.getTargetPosition();
            if (target == null) return;
            var head_rad = Math.atan2(target[0] - c[0], target[1] - c[1]);
            var view_distance = 0.001;
            var pnts = [c[0], c[1]];
            for (var a = - Math.PI / 6; a < + Math.PI / 6; a += + Math.PI / 24) {
                pnts.push(c[0] + Math.sin(head_rad + a) * view_distance * 1.5);
                pnts.push(c[1] + Math.cos(head_rad + a) * view_distance)
            };
            pnts.push(c[0]);
            pnts.push(c[1]);
            return pnts;
        }

        var me = {
            visionDistance: function () {
                return 0.0006;
            },
            maxSpeed: function () {
                return 0.0004;
            },
            directionChanged: function (v) {
                if (v) direction_changed = true;
                return direction_changed;
            },
            updMap: function (timestamp, pos_lon_lat) {
                if (timestamp - last_map_calculated < 300) return;
                last_map_calculated = timestamp;
                if (last_position_loaded == null) last_position_loaded = [pos_lon_lat[0] - 0.001, pos_lon_lat[1] - 0.001];
                var diff = { x: pos_lon_lat[0] - last_position_loaded[0], y: pos_lon_lat[1] - last_position_loaded[1] };
                if (last_map_calculated == 0 || Math.sqrt(diff.x * diff.x + diff.y * diff.y) > me.visionDistance() * 0.5 || me.directionChanged()) {
                    me.getOlus(pos_lon_lat);
                    last_position_loaded = [pos_lon_lat[0], pos_lon_lat[1]];
                }
            },
            getOlus: function (c) {
                var format = new ol.format.WKT();
                var ver_off = me.visionDistance();
                var hor_off = me.visionDistance();
                var pnts = generateViewSectorPoints(c);
                direction_changed = false;
                createViewSector(pnts);

                olu_source.getFeatures().forEach(function (feature) {
                    feature.set('flaged', true);
                })
                //console.log('done', (new Date()).getTime() - window.lasttime); window.lasttime = (new Date()).getTime();
                var spnts = '';
                for (var i = 0; i < pnts.length; i++) {
                    spnts += pnts[i].toString() + ' ';
                    if (i % 2 == 1 && i != pnts.length - 1) spnts += ', ';
                };
                var extents = `POLYGON ((${spnts}))`;
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
                    url: q
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
                                        var feature = new ol.Feature({ geometry: geom_transformed, olu: b.o.value, use: b.use.value, flaged: false });
                                        feature.setId(b.o.value);
                                        features.push(feature);
                                    } else {
                                        olu_source.getFeatureById(b.o.value).set('flaged', false);
                                    }
                                }
                            } catch (ex) {
                                //console.log(ex);
                            }
                        }
                        //olu_source.clear();
                        olu_source.addFeatures(features);
                        olu_source.getFeatures().forEach(function (feature) {
                            if (feature.get('flaged') == true) olu_source.removeFeature(feature);
                        })
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
            buildingExistsAtCoordinate: function (c) {
                var point = `POINT (${c.x} ${c.y})`;
                var tmp_result = false;
                var q = 'https://www.foodie-cloud.org/sparql?default-graph-uri=&query=' + encodeURIComponent(`PREFIX geo: <http://www.opengis.net/ont/geosparql#> 
                PREFIX geof: <http://www.opengis.net/def/function/geosparql/> 
                PREFIX virtrdf: <http://www.openlinksw.com/schemas/virtrdf#> 
                PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> 
                SELECT ?o 
                FROM <http://w3id.org/foodie/olu#> 
                WHERE { ?o geo:hasGeometry ?geometry. 
                    ?geometry geo:asWKT ?wkt. 
                    FILTER(bif:st_intersects(bif:st_geomfromtext("${point}"), ?wkt)).
                    ?o <http://w3id.org/foodie/olu#specificLandUse> ?use. 
                    FILTER(?use="13"^^xsd:string)
                } LIMIT 1`) + '&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on';

                $.ajax({
                    url: q,
                    async: false
                })
                    .done(function (response) {
                        tmp_result = response.results.bindings.length > 0
                    })
                return tmp_result;
            },
            getSpeed: function (cord) {
                var speed = me.maxSpeed();
                me.getOluUnder(cord).forEach(function (use) {
                    if (use == '13' || use == '10') {
                        speed = 0;
                        var audio = new Audio('oof.mp3');
                        audio.volume = .5;
                        audio.play();
                    }
                    if (greenery.indexOf(use) > -1) speed = me.maxSpeed() / 2.0;
                });
                return speed;
            },
            init: function (_$scope, _$compile, _map, _utils, _viewer, _character) {
                $scope = _$scope;
                $compile = _$compile;
                map = _map;
                utils = _utils;
                viewer = _viewer;
                character = _character;
            }
        }
        return me;
    }
)
