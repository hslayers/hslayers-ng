define(['ol'],

    function (ol) {
        var source = new ol.source.Vector();
        var $scope;
        var $compile;

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
            entity.billboard.scaleByDistance = new Cesium.NearFarScalar(50, 1.5, 15000, 0.0);
            var picture = entity.properties.visited.getValue() ? 'viewpoint' : 'other';
            entity.billboard.image = `../foodie-zones/symbols/${picture}.png`;
            entity.label = new Cesium.LabelGraphics({
                text: entity.properties.label,
                font: '14px Helvetica',
                fillColor: Cesium.Color.WHITE,
                outlineColor: new Cesium.Color(0.1, 0.1, 0.1, 0.9),
                outlineWidth: 2,
                showBackground: true,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                pixelOffset: new Cesium.Cartesian2(0, -30),
                scaleByDistance: new Cesium.NearFarScalar(50, 1.5, 15000, 0.0),
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
            });
        }

        return {
            createStations: function (map, utils, c) {
                var points_added = 0;
                var features = [];
                for (i = 1; i < 1000; i++) {
                    var try_pnt = { x: c[0] - 0.008 + Math.random() * 0.016, y: c[1] - 0.008 + Math.random() * 0.016 };
                    var found_close = false;
                    for (j = 0; j < features.length; j++) {
                        var diff = { x: features[j].getGeometry().getCoordinates()[0] - try_pnt.x, y: features[j].getGeometry().getCoordinates()[1] - try_pnt.y };
                        if (Math.sqrt(diff.x * diff.x + diff.y * diff.y) < 0.001) {
                            found_close = true;
                            break;
                        }
                    }
                    if (!found_close) {
                        var points = Math.floor((20 + Math.random() * 79));
                        var feature = new ol.Feature({
                            geometry: new ol.geom.Point([try_pnt.x, try_pnt.y]),
                            label: points.toFixed(0),
                            points: points,
                            visited: false
                        });
                        features.push(feature);
                        points_added++;
                    }
                    if (points_added > 50) break;
                }
                source.addFeatures(features);
                source.set('loaded', true);
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
                    if (Cesium.Cartesian3.distance(entity.position.getValue(), coords) < 5 && entity.properties.visited.getValue() == false) {
                        entity.properties.visited.setValue(true);
                        styleEntity(entity);
                        collected = Math.floor(entity.properties.points.getValue() / 10);
                    }
                });
                return collected;
            },
            init: function (_$scope, _$compile) {
                $scope = _$scope;
                $compile = _$compile;
            }
        }
    }
)
