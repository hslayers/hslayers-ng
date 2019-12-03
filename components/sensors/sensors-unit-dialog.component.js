export default {
    template: require('./partials/unit-dialog.html'),
    bindings: {
        unit: '='
    },
    controller: ['$scope', 'hs.map.service', 'hs.sensors.service', 'hs.layout.service', 'hs.sensors.service', function ($scope, OlMap, sensorsService, layoutService, sensorService) {
        var map;
        sensorsService.unitDialogVisible = true;
        angular.extend($scope, {
            layoutService,
            sensorsService,
            /**
             * @memberof hs.sensors.unitDialog
             * @function sensorClicked
             * @description Regenerate chart for sensor is clicked. If no 
             * interval was clicked before use 1 day timeframe by default.
             */
            sensorClicked(sensor) {
                sensorsService.selectSensor(sensor);
                if (angular.isUndefined(sensorsService.currentInterval)) {
                    $scope.timeButtonClicked({ amount: 1, unit: 'days' })
                } else
                    sensorService.createChart($scope.$ctrl.unit)
            },

            /**
             * @memberof hs.sensors.unitDialog
             * @function timeButtonClicked
             * @description Get data for different time interval and regenerate 
             * chart
             */
            timeButtonClicked(interval) {
                sensorsService.currentInterval = interval;
                sensorsService.getObservationHistory(
                    sensorsService.unit,
                    interval
                ).then(_ => sensorService.createChart(sensorsService.unit))
            }           
        });

        function init() {
            map = OlMap.map;
        }

        OlMap.loaded().then(init);
    }]
}