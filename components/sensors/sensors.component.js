export default {
  template: require('./partials/panel.html'),
  controller: ['$scope', 'hs.map.service', 'hs.sensors.service', function ($scope, OlMap, sensorsService) {
    angular.extend($scope, {
      service: sensorsService,
      viewMode: 'sensors',

      setViewMode(viewMode) {
        $scope.viewMode = viewMode;
      },

      toggleExpansion() {
        $scope.viewExpanded = !$scope.viewExpanded;
        if (!$scope.viewExpanded) {
          sensorsService.units.forEach(element => {
            element.expanded = false;
          });
        }
      }
    });

    /**
     * @memberof hs.sensors.component
     * @function init
     * @description Init function used to populate list of units and later
     * create some map functionality
     */
    function init() {
      sensorsService.getUnits();
    }

    OlMap.loaded().then(init);

    $scope.$emit('scope_loaded', 'Sensors');
  }]
};
