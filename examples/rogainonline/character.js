define(['cesium'],

    function () {

        var next_speed = 0.0;
        var current_speed = 0.0;
        var acceleration_started_at = 0.0;
        var acceleration_start_speed = 0.0;
        var position_property;
        var pos_lon_lat = [15.05895482842926, 50.77674947558131];
        var pick_rectangle;
        var pick_rectangle_primitive = null;
        var target_position = pos_lon_lat;
        var orientation = [0, 0];
        var orientation_property;
        var character;
        var olus;
        var viewer;
        var stations;
        var last_altitude_calculated = 0;
        var last_position_altitude = [0, 0];

        function normalize(point, scale) {
            var norm = Math.sqrt(point.x * point.x + point.y * point.y);
            if (norm != 0) { // as3 return 0,0 for a point of zero length
                point.x = scale * point.x / norm;
                point.y = scale * point.y / norm;
            }
        }

        position_property = new Cesium.CallbackProperty(function () {
            return Cesium.Cartesian3.fromDegrees(pos_lon_lat[0], pos_lon_lat[1], pos_lon_lat[2])
        }, false);

        orientation_property = new Cesium.CallbackProperty(function () {
            var head_rad = Math.atan2(orientation[1], orientation[0]);
            var heading = -head_rad;
            var pitch = 0.0;
            var roll = 0.0;
            var hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
            return Cesium.Transforms.headingPitchRollQuaternion(position_property.getValue(), hpr)
        }, false);

        function positionCharacter(time_ellapsed, timestamp) {
            var accelerating_for = (timestamp - acceleration_started_at);
            if (accelerating_for > 3000) accelerating_for = 3000;
            current_speed = acceleration_start_speed + (next_speed - acceleration_start_speed) * accelerating_for / 3000;
            var speed = current_speed * time_ellapsed / 1000.0;
            if (speed > 0) {
                var diff = { x: target_position[0] - pos_lon_lat[0], y: target_position[1] - pos_lon_lat[1] };
                if (Math.sqrt(diff.x * diff.x + diff.y * diff.y) < speed) {
                    //target_position = null;
                    next_speed = 0.0;
                    current_speed = 0.0;
                    acceleration_start_speed = 0.0;
                    speed = 0.0;
                    return;
                }
                //Hen going straight to north or south, half of speed must be canceled because there are 90 latitude degrees but 180 longitude
                var degree_canceler = Math.abs(Math.sin(Math.atan2(diff.y, diff.x)));
                normalize(diff, speed - (0.5 * speed * degree_canceler));
                var secs_km = (400 / (speed * 100000.0)).toFixed(0);
                $scope.min_km = Math.floor(secs_km / 60) + ':' + (secs_km % 60 < 10 ? '0' : '') + (secs_km % 60);
                var new_position = [pos_lon_lat[0] + diff.x, pos_lon_lat[1] + diff.y];
                next_speed = olus.getSpeed(new_position);
                if (next_speed > 0) {
                    orientation = [diff.x, diff.y];
                    pos_lon_lat[0] = new_position[0];
                    pos_lon_lat[1] = new_position[1];
                    $scope.points_collected += stations.checkAtCoords(Cesium.Cartesian3.fromDegrees(pos_lon_lat[0], pos_lon_lat[1], 0));
                } else {
                    current_speed = 0.0;
                    acceleration_start_speed = 0.0;
                }
            }
            calculateAltitude(timestamp);
            olus.updMap(timestamp, pos_lon_lat);
        }

        function flyToInitialLocation() {
            var positions = [
                Cesium.Cartographic.fromDegrees(pos_lon_lat[0], pos_lon_lat[1])
            ];
            var promise = Cesium.sampleTerrainMostDetailed(viewer.terrainProvider, positions);
            Cesium.when(promise, function (updatedPositions) {
                pos_lon_lat[2] = updatedPositions[0].height;
                viewer.camera.flyTo({
                    destination: Cesium.Cartesian3.fromDegrees(pos_lon_lat[0], pos_lon_lat[1] + 0.0005, pos_lon_lat[2] + 60),
                    orientation: {
                        heading: Cesium.Math.toRadians(180.0),
                        pitch: Cesium.Math.toRadians(-45.0),
                        roll: 0.0
                    }
                })
            });
        }

        function calculateAltitude(timestamp) {
            if (timestamp - last_altitude_calculated < 500) return;
            last_altitude_calculated = timestamp;
            var diff = { x: pos_lon_lat[0] - last_position_altitude[0], y: pos_lon_lat[1] - last_position_altitude[1] };
            if (Math.sqrt(diff.x * diff.x + diff.y * diff.y) > 0.00001) {
                last_position_altitude = [pos_lon_lat[0], pos_lon_lat[1]];
                var positions = [
                    Cesium.Cartographic.fromDegrees(pos_lon_lat[0], pos_lon_lat[1])
                ];
                var promise = Cesium.sampleTerrainMostDetailed(viewer.terrainProvider, positions);
                Cesium.when(promise, function (updatedPositions) {
                    pos_lon_lat[2] = updatedPositions[0].height;
                    last_position = position.clone();
                });
            }
        }

        function changeTargetPosition(lon_lat, last_time) {
            target_position = lon_lat;
            acceleration_started_at = last_time;
            acceleration_start_speed = current_speed;
            next_speed = olus.getSpeed(pos_lon_lat);
            createTargetPrimitive()
        }

        function createTargetPrimitive() {
            if (pick_rectangle_primitive != null) {
                viewer.scene.primitives.remove(pick_rectangle_primitive);
            }
            pick_rectangle = new Cesium.GeometryInstance({
                geometry: new Cesium.CircleGeometry({
                    center: Cesium.Cartesian3.fromDegrees(target_position[0], target_position[1]),
                    radius: 0.5
                }),
                id: 'target1',
                attributes: {
                    color: new Cesium.ColorGeometryInstanceAttribute(0.0, 0.8, 0.1, 0.5)
                }
            });
            pick_rectangle_primitive = viewer.scene.primitives.add(new Cesium.GroundPrimitive({
                geometryInstances: pick_rectangle,
                allowPicking: true,
                releaseGeometryInstances: false
            }));
        }

        return {
            positionCharacter,
            changeTargetPosition,
            currentPos: function () { return pos_lon_lat },
            init: function (_$scope, _$compile, _olus, _viewer, _stations) {
                $scope = _$scope;
                $compile = _$compile;
                olus = _olus;
                viewer = _viewer;
                stations = _stations;

                character = viewer.entities.add({
                    model: {
                        uri: 'Cesium_Man.gltf',
                        scale: 2
                    },
                    billboard: {
                        image: 'runner.png',
                        pixelOffset: new Cesium.Cartesian2(0, -6), scaleByDistance: new Cesium.NearFarScalar(100, 0.01, 500, 0.1),
                    },
                    position: position_property,
                    orientation: orientation_property
                });
                flyToInitialLocation();
            }
        }
    }
)
