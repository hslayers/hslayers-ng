export default ['$scope', 'hs.geolocation.service', 'hs.map.service', 'Core', function ($scope, service, OlMap, Core) {
    $scope.speed = null;
    $scope.alt = null;
    $scope.altitudeAccuracy = null;
    $scope.accuracy = null;
    $scope.Geolocation = service;

    if (Core.isMobile()) {
        $scope.switchGps = service.toggleGps;

        /**
        * Tracking info/starter, without argument return tracking status. With argument start tracking for mobile, with argument "True" start tracking for desktop 
        * @memberof hs.geolocation.controller
        * @function gpsActive
        * @param {Boolean} set_to Optional argument
        */
        $scope.gpsActive = function (set_to) {
            if (arguments.length === 0) {
                return service.gpsStatus;
                console.log('arguments = 0');
            } else {
                service.startGpsWatch();
                console.log('Starting GPS.');
            }
        };
    } else {
        //Same as above, but for desktop version
        $scope.gpsActive = function (set_to) {
            if (arguments.length == 0)
                return service.geolocation.getTracking();
            else {
                service.geolocation.setTracking(set_to);
            }
        };
    }

    /**
    * Return which geolocation provider is currently used (Geolocation API / ol.Geolocation)
    * @memberof hs.geolocation.controller
    * @function getGeolocationProvider
    */
    $scope.getGeolocationProvider = function () {
        return service.geolocation;
    };

    /**
    * State manager of following function. Without arguments returns following state in Boolean. With argument change following state.
    * @memberof hs.geolocation.controller
    * @function following
    * @param {Boolean} set_to Optional - Desired following state
    */
    $scope.following = function (set_to) {
        if (arguments.length == 0) return service.following; else {
            service.following = set_to;
            if (console) console.log(service.last_location);
            if (set_to) service.setRotation();

            if (angular.isDefined(service.last_location)) {
                if (set_to) {
                    OlMap.map.getView().setCenter(service.last_location.latlng);

                }

                if (Core.isMobile()) service.changed_handler();
            } else {
                if (console) console.log('last location not defined');
            }
        }
    };
    /**
    * Change style of location layer
    * @memberof hs.geolocation.controller
    * @function setFeatureStyle
    * @param {ol.style.Style} style New style of location layer 
    */
    $scope.setFeatureStyle = function (style) {
        return service.style = style;
    }

    $scope.$on('geolocation.updated', function (event) {
        $scope.speed = service.speed;
        $scope.alt = service.altitude;
        $scope.accuracy = service.accuracy;
        $scope.altitudeAccuracy = service.altitudeAccuracy;
        if (!$scope.$$phase) $scope.$digest();
    });

    $scope.$on('geolocation.switched', function (event) {
        service.gpsSwitch = service.gpsStatus ? 'Stop GPS' : 'Start GPS';
        if (!$scope.$$phase) $scope.$digest();
    });

    $scope.$emit('scope_loaded', "Geolocation");
}]