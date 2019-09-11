export default ['hs.map.service', 'hs.geolocation.service', 'Core', 'config', function (OlMap, Geolocation, Core, config) {
    return {
        template: Core.isMobile() ? require('components/geolocation/partials/geolocation_cordova.html') : require('components/geolocation/partials/geolocation.html'),
        link: function link(scope, element, attrs) {
            if (!Core.puremapApp) {
                if (Core.isMobile()) {
                    document.querySelector("#menu").appendChild(element[0]);
                } else {
                    document.querySelector(".ol-overlaycontainer-stopevent").appendChild(element[0]);
                }
            }
        },
        controller: ['$scope', 'config', function ($scope, config) {
            $scope.collapsed = true;
            $scope.blocateClick = function (e) {
                //Checking target is needed because follow button is inside locate button (container) 
                //and because of that follow button triggers click on parent element
                if (!e.target.classList.contains('locateToggler')) return;
                $scope.collapsed = !$scope.collapsed;
                Geolocation.toggleFeatures(!$scope.collapsed);
                if (Core.isMobile()) {
                    Geolocation.toggleGps();
                } else {
                    Geolocation.geolocation.setTracking(true);
                }
            }

            $scope.geolocationVisible = function () {
                return (angular.isUndefined(config.locationButtonVisible)
                    || config.locationButtonVisible) &&
                    (angular.isUndefined(Core.puremapApp) ||
                        Core.puremapApp === false);
            }
        }],
        replace: true
    };
}]