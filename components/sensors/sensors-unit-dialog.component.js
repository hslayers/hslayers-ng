export default {
    template: require('./partials/unit-dialog.html'),
    bindings: {
        unit: '='
    },
    controller: ['$scope', 'hs.map.service', 'hs.sensors.service', 'hs.layout.service', 'hs.sensors.service', function ($scope, OlMap, sensorsService, layoutService, sensorService) {
        var map;
        sensorsService.unitDialogVisible = true;
        angular.extend($scope, {
            sensorsService,
            intervals: [
                { name: '1H', amount: 1, unit: 'hours' },
                { name: '1D', amount: 1, unit: 'days' },
                { name: '1W', amount: 1, unit: 'weeks' },
                { name: '1M', amount: 1, unit: 'months' },
                { name: '6M', amount: 6, unit: 'months' }
            ],
            loaderImage: require('../../img/ajax-loader.gif'),
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
            },
            dialogStyle() {
                return {
                    'visibility': sensorsService.unitDialogVisible ? 'visible' : 'hidden',
                    'left': layoutService.sidebarBottom() ? '3px' : (layoutService.panelSpaceWidth() + 10) + 'px',
                    'width': layoutService.sidebarBottom() ? '100%' : 'calc(' + layoutService.widthWithoutPanelSpace() + ')',
                    'bottom': layoutService.sidebarBottom() ? '46.5em' : '0',
                    'height': layoutService.sidebarBottom() ? '5em' : 'auto',
                }
            },
        });

        function init() {
            map = OlMap.map;
        }

        OlMap.loaded().then(init);
    }]
}