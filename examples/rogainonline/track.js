define(['cesium'],

    function () {
        var $scope;
        var character;
        var viewer;
        var stations;
        var last_good_altitude = null;
        var running_line_segments = [];
        var last_run_position = null;
        var track_points = [];
        var track_line_primitive = null;
        var track_segment_collection = [];
        var last_run_counted = 0;
        var distance_counter_timer = null;

        function addRunPosition(lon_lat) {
            if (last_run_position == null)
                last_run_position = character.currentPos();
            var caretesian_pos = Cesium.Cartesian3.fromDegrees(lon_lat[0], lon_lat[1]);
            var distance = Cesium.Cartesian3.distance(Cesium.Cartesian3.fromDegrees(last_run_position[0], last_run_position[1]), caretesian_pos);
            if (distance > 0) {
                track_points.push(caretesian_pos);
                $scope.total_distance_run += distance;
                if (track_points.length > 1) {
                    var lineInstance = new Cesium.GeometryInstance({
                        geometry: new Cesium.CorridorGeometry({
                            positions: track_points,
                            width: 5
                        }),
                        attributes: {
                            color: new Cesium.ColorGeometryInstanceAttribute(0.9, .9, .1, 0.8)
                        }
                    });
                    if (track_line_primitive != null) viewer.scene.primitives.remove(track_line_primitive);
                    track_line_primitive = new Cesium.GroundPrimitive({
                        geometryInstances: lineInstance
                    })
                    viewer.scene.primitives.add(track_line_primitive);
                    if (track_points.length >= 200) {
                        track_segment_collection.push(track_line_primitive)
                        track_line_primitive = null;
                        track_points = [caretesian_pos];
                    }
                }
                running_line_segments.push({ point: [lon_lat[0], lon_lat[1], lon_lat[2]], time: new Date(), distance: distance });
            }
            last_run_position = [lon_lat[0], lon_lat[1], lon_lat[2]];
        }

        function startDistanceCounting(){
            if (distance_counter_timer != null) clearInterval(distance_counter_timer);
            distance_counter_timer = setInterval(function () { countRunDistance(gamestates.getLastTime()) }, 2000 / $scope.time_multiplier);
        }

        function download(filename, text) {
            var element = document.createElement('a');
            element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
            element.setAttribute('download', filename);

            element.style.display = 'none';
            document.body.appendChild(element);

            element.click();

            document.body.removeChild(element);
        }

        function countRunDistance(last_time) {
            if ($scope.game_state != 'running') return;
            if (last_time - last_run_counted < 500) return;
            last_run_counted = last_time;
            addRunPosition(character.currentPos());
        }

        function locationUpdated(data){
            if (data && angular.isDefined(data.latlng)) {
                $scope.geolocated = true;
                var l = data.latlng;
                if (character.currentPos()[2] > 0)
                    last_good_altitude = character.currentPos()[2]
                var altitude_bad = data.altitude == null || angular.isUndefined(data.altitude);
                var altitude = (data.altitude || last_good_altitude) || 0;
                character.currentPos([l[0], l[1], altitude]);
                $scope.points_collected += stations.checkAtCoords(Cesium.Cartesian3.fromDegrees(character.currentPos()[0], character.currentPos()[1], 0));
                if (altitude_bad) {
                    character.calculateAltitude(last_time)
                }

            }
        }

        function clear(){
            if (track_line_primitive != null) viewer.scene.primitives.remove(track_line_primitive);
            angular.forEach(track_segment_collection, function (line) {
                viewer.scene.primitives.remove(line);
            })
            last_run_position = null;
            track_points = [];
        }

        function getGpx() {
            var head = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Rogainonline.com" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd http://www.garmin.com/xmlschemas/GpxExtensions/v3 http://www.garmin.com/xmlschemas/GpxExtensionsv3.xsd http://www.garmin.com/xmlschemas/TrackPointExtension/v1 http://www.garmin.com/xmlschemas/TrackPointExtensionv1.xsd" xmlns="http://www.topografix.com/GPX/1/1" xmlns:gpxtpx="http://www.garmin.com/xmlschemas/TrackPointExtension/v1" xmlns:gpxx="http://www.garmin.com/xmlschemas/GpxExtensions/v3" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
<metadata>
<time>${(new Date()).toISOString()}</time>
</metadata>
<trk>
<src>http://www.rogainonline.com/</src>
<link href="https://www.endomondo.com/users/1974971/workouts/1007491933">
    <text>rogainonline</text>
</link>
<type>ORIENTEERING</type>
<trkseg>
                `;
            var trkpts = running_line_segments.reduce((accumulator, l) => `${accumulator}<trkpt lat="${l.point[1]}" lon="${l.point[0]}">
            <ele>${l.point[2]}</ele>
            <time>${l.time.toISOString()}</time>
          </trkpt>`, '');
            var end = `         </trkseg>
</trk>
</gpx>`;

            download('rogainonline_' + (new Date()).toISOString() + '.gpx', head + trkpts + end);
        }

        return {
            init: function (_$scope, _$compile, _viewer, _stations, _character, _gamestates) {
                $scope = _$scope;
                $compile = _$compile;
                viewer = _viewer;
                stations = _stations;
                character = _character;
                gamestates = _gamestates;

                $scope.getGpx = getGpx;
                $scope.total_distance_run = 0;
            },
            locationUpdated,
            countRunDistance,
            clear,
            startDistanceCounting
        }
    }
)
