define(['cesium'],

    function () {
        var $scope;
        var character;
        var viewer;
        var stations;
        var track;
        var planning;
        var zero_date = new Date(2000, 1, 0, 0, 0, 0, 0, 1);
        var full_date = new Date(2000, 1, 0, 4, 30, 0, 0);
        var running_start_date = new Date(2000, 1, 0, 4, 0, 0, 0);
        var time_game_started;
        var map;
        var utils;
        var $timeout;
        var last_time = 0;

        function createNewMap (hours) {
            $scope.game_started = true;
            $scope.game_state = 'generating';
            if (!$scope.$$phase) $scope.$apply();
            $timeout(function () {
                $scope.points_collected = 0;
                full_date = new Date(2000, 1, 0, hours, 30, 0, 0);
                running_start_date = new Date(2000, 1, 0, hours, 0, 0, 0);
                time_game_started = last_time;
                stations.createStations(map, utils, character.currentPos(), function (bounds) {
                    $scope.game_state = 'planning';
                    last_measure_pick = character.currentPos();
                    flyToWholeMapView(hours, bounds);
                }, hours);
            }, 0)
        }

        function donePlanning() {
            time_game_started = last_time;
            full_date = running_start_date;
            startRunning()
        }

        function startRunning() {
            $scope.game_started = true;
            stations.playCollectedAudio();
            track.startDistanceCounting();
            $scope.game_state = 'running';
            character.flyToInitialLocation(true);
            playGo();
        }

        function playGo() {
            var audio = new Audio('sounds/go.mp3');
            audio.play();
        }

        function tick(timestamp){
            last_time = timestamp;
            if ($scope.game_started) {
                $scope.time_remaining = full_date - (timestamp - time_game_started) * $scope.time_multiplier;
                if ($scope.time_remaining <= running_start_date && $scope.game_state == 'planning') {
                    startRunning()
                }
                if ($scope.time_remaining <= zero_date) {
                    $scope.time_remaining = zero_date;
                    $scope.time_penalty = Math.ceil((zero_date - (full_date - (timestamp - time_game_started) * $scope.time_multiplier)) / 60000);
                }
            }
        }


        function flyToWholeMapView(hours, bounds) {
            var pos_lon_lat = character.currentPos();
            var needed = viewer.camera.getRectangleCameraCoordinates(new Cesium.Rectangle.fromDegrees(bounds.west, bounds.south, bounds.east, bounds.north));
            viewer.camera.flyTo({
                destination: needed,
                orientation: {
                    heading: Cesium.Math.toRadians(0.0),
                    pitch: Cesium.Math.toRadians(-90.0),
                    roll: 0.0
                }
            })
        }

        function endGame() {
            var el = angular.element('<div hs.enddialog></div>');
            $("#hs-dialog-area").append(el);
            $compile(el)($scope);
            $scope.game_started = false;
            var audio = new Audio('sounds/fanfare.mp3');
            audio.play();
        }

        function restart() {
            $scope.game_state = 'before_game';
            $scope.game_started = false;
            $scope.total_distance_run = 0;
            $scope.total_distance = 0;
            stations.clear();
            track.clear();
            planning.clear();
        }

        function getLastTime(){
            return last_time;
        }

        return {
            init: function (_$scope, _$compile, _viewer, _stations, _character, _track, _map, _utils, _planning, _$timeout) {
                $scope = _$scope;
                $compile = _$compile;
                viewer = _viewer;
                stations = _stations;
                character = _character;
                track = _track;
                map = _map;
                utils = _utils;
                planning = _planning;
                $timeout = _$timeout;

                $scope.createNewMap = createNewMap;
                $scope.donePlanning = donePlanning;
                $scope.endGame = endGame;
                $scope.restart = restart;

                $scope.game_state = 'before_game';
            },
            startRunning,
            tick,
            getLastTime
        }
    }
)
