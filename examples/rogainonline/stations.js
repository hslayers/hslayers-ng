define(['ol'],

    function (ol) {
        var source = new ol.source.Vector();
        var $scope;
        var $compile;
        var olus;
        var anything_collected = false;

        function entityClicked(entity) {
            $scope.showInfo(entity);
            if ($('#zone-info-dialog').length > 0) {
                angular.element('#zone-info-dialog').parent().remove();
            }
            var el = angular.element('<div hs.foodiezones.info-directive></div>');
            $("#hs-dialog-area").append(el);
            $compile(el)($scope);
        }

        source.cesiumStyler = function (dataSource) {
            var entities = dataSource.entities.values;
            for (var i = 0; i < entities.length; i++) {
                var entity = entities[i];
                styleEntity(entity);
            }
        }

        function styleEntity(entity) {
            entity.billboard.scaleByDistance = new Cesium.NearFarScalar(50, 1.5, 40000, 0.0);
            var picture = entity.properties.visited.getValue() ? 'viewpoint' : 'other';
            entity.billboard.image = entity.properties.start ? 'triangle-outline-64.png' : `../foodie-zones/symbols/${picture}.png`;
            entity.billboard.eyeOffset = new Cesium.Cartesian3(0.0,0.0,-100.0);
            entity.label = new Cesium.LabelGraphics({
                text: entity.properties.label,
                font: '18px "Lato", sans-serif',
                fillColor: Cesium.Color.WHITE,
                outlineColor: new Cesium.Color(0.1, 0.1, 0.1, 0.9),
                outlineWidth: 2,
                showBackground: true,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                pixelOffset: new Cesium.Cartesian2(0, entity.properties.start ? -50 : -40),
                pixelOffsetScaleByDistance: new Cesium.NearFarScalar(50, 1.5, 20000, 0.0),
                scaleByDistance: new Cesium.NearFarScalar(50, 1.5, 20000, 0.0),
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                eyeOffset: new Cesium.Cartesian3(0.0,0.0,-200.0)
            });
        }

        function stationExistsAtCoordinate(try_pnt, features) {
            var found_close = false;
            for (j = 0; j < features.length; j++) {
                var diff = { x: features[j].getGeometry().getCoordinates()[0] - try_pnt.x, y: features[j].getGeometry().getCoordinates()[1] - try_pnt.y };
                if (Math.sqrt(diff.x * diff.x + diff.y * diff.y) < 0.003) {
                    found_close = true;
                    break;
                }
            }
            return found_close
        }

        function getMapWidth(hours) {
            return 10 * hours / 4;
        }
        return {
            getMapWidth: getMapWidth,
            createStations: function (map, utils, c, callback, hours) {
                var points_added = 0;
                source.clear();
                var features = [new ol.Feature({
                    geometry: new ol.geom.Point([c[0], c[1]]),
                    label: 'START / FINISH',
                    points: 0,
                    start: true,
                    visited: false
                })];
                var bounds = {west: null, east: null, north: null, south: null };
                for (i = 1; i < 1000; i++) {
                    var to_deg_x = (111.320 * Math.cos(c[1] * Math.PI / 180));
                    var to_deg_y = 110;
                    var try_pnt = {
                        x: c[0] - getMapWidth(hours) / 2.0 / to_deg_x + Math.random() * getMapWidth(hours) / to_deg_x,
                        y: c[1] - getMapWidth(hours) / 2.0 / to_deg_y + Math.random() * getMapWidth(hours) / to_deg_y
                    };
                    if (!olus.buildingExistsAtCoordinate(try_pnt) && !stationExistsAtCoordinate(try_pnt, features)) {
                        var points = Math.floor((20 + Math.random() * 69));
                        var feature = new ol.Feature({
                            geometry: new ol.geom.Point([try_pnt.x, try_pnt.y]),
                            label: points.toFixed(0),
                            points: points,
                            visited: false
                        });
                        if(bounds.west==null || try_pnt.x < bounds.west) bounds.west = try_pnt.x;
                        if(bounds.east==null || try_pnt.x > bounds.east) bounds.east = try_pnt.x;
                        if(bounds.north==null || try_pnt.y > bounds.north) bounds.north = try_pnt.y;
                        if(bounds.south==null || try_pnt.y < bounds.south) bounds.south = try_pnt.y;
                        features.push(feature);
                        points_added++;
                    }
                    if (points_added >= 40 * (hours / 3)) break;
                }
                source.addFeatures(features);
                source.set('loaded', true);
                source.dispatchEvent('features:loaded', source);
                callback(bounds);
            },
            clear(){
                source.clear();
                source.dispatchEvent('features:loaded', source);
            },
            createLayer: function () {
                return new ol.layer.Vector({
                    title: "Stations",
                    source: source,
                    visible: true
                })
            },
            checkAtCoords: function (coords) {
                var collected = 0.0;
                source.cesium_layer.entities.values.forEach(function (entity) {
                    if (Cesium.Cartesian3.distance(entity.position.getValue(), coords) < 15 && entity.properties.visited.getValue() == false) {
                        if (entity.properties.start) {
                            if (anything_collected) {
                                entity.properties.visited.setValue(true);
                                anything_collected = false;
                                $scope.endGame();
                            }
                        } else {
                            entity.properties.visited.setValue(true);
                            var audio = new Audio('sounds/collectcoin.mp3');
                            audio.play();
                            anything_collected = true;
                            styleEntity(entity);
                            collected = Math.floor(entity.properties.points.getValue() / 10);
                        }
                    }
                });
                return collected;
            },
            init: function (_$scope, _$compile, _olus) {
                $scope = _$scope;
                $compile = _$compile;
                olus = _olus;
            }
        }
    }
)
