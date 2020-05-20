/**
 * @param HsMapService
 * @param HsGeolocationService
 * @param HsLayoutService
 */
export default function (HsMapService, HsGeolocationService, HsLayoutService) {
  'ngInject';
  return {
    template: require('./partials/geolocation.html'),
    link: function link(scope, element, attrs) {
      if (HsLayoutService.componentEnabled('geolocationButton')) {
        HsMapService.loaded().then((_) => {
          const container = HsLayoutService.contentWrapper.querySelector(
            '.ol-overlaycontainer-stopevent'
          );
          if (container) {
            container.appendChild(element[0]);
          }
        });
      }
    },
    controller: [
      '$scope',
      'HsConfig',
      function ($scope, config) {
        $scope.locationService = HsGeolocationService;
        $scope.collapsed = true;

        $scope.geolocationVisible = function () {
          return HsLayoutService.componentEnabled('geolocationButton');
        };
      },
    ],
  };
}
