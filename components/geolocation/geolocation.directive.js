export default ['hs.map.service', 'hs.geolocation.service', 'Core', 'config', 'hs.layout.service',
    function (hsMap, locationService, Core, config, layoutService) {
        return {
            template: require('components/geolocation/partials/geolocation.html'),
            link: function link(scope, element, attrs) {
                if (!Core.puremapApp) {
                    hsMap.loaded().then(_ => {
                        layoutService.contentWrapper.querySelector(".ol-overlaycontainer-stopevent").appendChild(element[0]);
                    })
                }
            },
            controller: ['$scope', 'config', function ($scope, config) {
                $scope.locationService = locationService;
                $scope.collapsed = true;

                $scope.geolocationVisible = function () {
                    return (angular.isUndefined(config.locationButtonVisible)
                        || config.locationButtonVisible) &&
                        (angular.isUndefined(Core.puremapApp) ||
                            Core.puremapApp === false);
                }
            }],

        };
    }]