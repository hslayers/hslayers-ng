define(['cesium'],

    function () {
        var $scope;
        var character;
        var viewer;
        var stations;
        var last_measure_pick = null;
        var planning_line_segments = [];

        function clear(){
            angular.forEach(planning_line_segments, function (line) {
                viewer.scene.primitives.remove(line);
            })
            last_measure_pick = null;
        }

        function addMeasurementPosition(lon_lat) {
            if (last_measure_pick == null)
                last_measure_pick = character.currentPos();
            var distance = Cesium.Cartesian3.distance(Cesium.Cartesian3.fromDegrees(last_measure_pick[0], last_measure_pick[1]), Cesium.Cartesian3.fromDegrees(lon_lat[0], lon_lat[1]));
            $scope.total_distance += distance;
            var rectangleInstance = new Cesium.GeometryInstance({
                geometry: new Cesium.CorridorGeometry({
                    positions: Cesium.Cartesian3.fromDegreesArray([last_measure_pick[0], last_measure_pick[1], lon_lat[0], lon_lat[1]]),
                    width: 5
                }),
                attributes: {
                    color: new Cesium.ColorGeometryInstanceAttribute(0.9, .2, .2, 0.8)
                }
            });
            var line = viewer.scene.primitives.add(new Cesium.GroundPrimitive({
                geometryInstances: rectangleInstance
            }));
            line.distance = distance;
            planning_line_segments.push(line);
            last_measure_pick = lon_lat;
        }

        return {
            init: function (_$scope, _$compile, _viewer, _stations, _character) {
                $scope = _$scope;
                $compile = _$compile;
                viewer = _viewer;
                stations = _stations;
                character = _character;

                $scope.total_distance = 0;
            },
            clear,
            addMeasurementPosition
        }
    }
)
