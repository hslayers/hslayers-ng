export default {
  template: require('./partials/panel.html'),
  controller: function ($scope, HsMapService, HsSensorsService) {
    'ngInject';
    angular.extend($scope, {
      service: HsSensorsService,
      viewMode: 'sensors',

      setViewMode(viewMode) {
        $scope.viewMode = viewMode;
      },

      toggleExpansion() {
        $scope.viewExpanded = !$scope.viewExpanded;
        if (!$scope.viewExpanded) {
          HsSensorsService.units.forEach((element) => {
            element.expanded = false;
          });
        }
      },
    });

    /**
     * @memberof hs.sensors.component
     * @function init
     * @description Init function used to populate list of units and later
     * create some map functionality
     */
    function init() {
      HsSensorsService.getUnits();
    }

    HsMapService.loaded().then(init);

    $scope.$emit('scope_loaded', 'Sensors');
  },
};
