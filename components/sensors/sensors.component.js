export default {
    template: require('components/sensors/partials/panel.html'),
    controller: ['$scope', 'hs.map.service', 'hs.sensors.service', function ($scope, OlMap, sensorsService) {
        var map;

        angular.extend($scope, {
            service: sensorsService,         
        });

        /**
         * @memberof hs.sensors.component
         * @function init
         * @description Init function used to populate list of units and later 
         * create some map functionality
         */
        function init() {
            map = OlMap.map;
            sensorsService.getUnits();
        }

        OlMap.loaded().then(init);

        $scope.$emit('scope_loaded', "Sensors");
    }]
}