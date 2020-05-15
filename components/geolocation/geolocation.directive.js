export default ['HsMapService', 'HsGeolocationService', 'HsCore', 'HsConfig', 'HsLayoutService',
  function (hsMap, locationService, HsCore, config, layoutService) {
    return {
      template: require('./partials/geolocation.html'),
      link: function link(scope, element, attrs) {
        if (layoutService.componentEnabled('geolocationButton')) {
          hsMap.loaded().then(_ => {
            layoutService.contentWrapper.querySelector('.ol-overlaycontainer-stopevent').appendChild(element[0]);
          });
        }
      },
      controller: ['$scope', 'HsConfig', function ($scope, config) {
        $scope.locationService = locationService;
        $scope.collapsed = true;

        $scope.geolocationVisible = function () {
          return layoutService.componentEnabled('geolocationButton');
        };
      }]

    };
  }];
