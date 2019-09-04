export default {
    template: require('./partials/unit-list-item.html'),
    bindings: {
        unit: '=',
        expanded: '=',
        viewMode: '='
    },
    controller: ['$scope', 'hs.map.service', 'hs.sensors.service', '$compile', '$timeout', function ($scope, OlMap, sensorsService, $compile, $timeout) {
        var map;
        angular.extend($scope, {
            sensorsService,

            /**
             * @memberof hs.sensors.unitListItem
             * @function unitClicked
             * @description When unit is clicked, create a dialog window for 
             * displaying charts or reopen already existing one.
             */
            unitClicked() {
                sensorsService.unit = $scope.$ctrl.unit;
                $scope.$ctrl.unit.expanded = !$scope.$ctrl.unit.expanded;
                sensorsService.selectSensor($scope.$ctrl.unit.sensors[0]);
                if (document.querySelector('#sensor-unit-dialog') == null) {
                    const dir = 'hs.sensors.unit-dialog';
                    const html = `<${dir} unit="sensorsService.unit"></${dir}>`;
                    const element = angular.element(html)[0];
                    document.querySelector(".gui-overlay").appendChild(element);
                    $compile(element)($scope);
                } else {
                    sensorsService.unitDialogVisible = true;
                }
                $timeout(_ => {
                    if (angular.isUndefined(sensorsService.currentInterval))
                        sensorsService.currentInterval = { amount: 1, unit: 'days' };
                    sensorsService.getObservationHistory(
                        sensorsService.unit,
                        sensorsService.currentInterval
                    ).then(_ => sensorsService.createChart(sensorsService.unit))

                }, 0)
            },

            /**
             * @memberof hs.sensors.unitListItem
             * @function sensorClicked
             * @param {Object} sensor
             * @description When sensor is clicked, create a dialog window for 
             * displaying charts or reopen already existing one.
             */
            sensorClicked(sensor) {
                sensorsService.unit = $scope.$ctrl.unit;
                sensorsService.selectSensor(sensor);
                if (document.querySelector('#sensor-unit-dialog') == null) {
                    const dir = 'hs.sensors.unit-dialog';
                    const html = `<${dir} 
                        unit="sensorsService.unit"W
                        ></${dir}>`;
                    const element = angular.element(html)[0];
                    document.querySelector(".gui-overlay").appendChild(element);
                    $compile(element)($scope);
                } else {
                    sensorsService.unitDialogVisible = true;
                }
                $timeout(_ => {
                    sensorsService.createChart(sensorsService.unit)
                }, 0)
            }
        });

        function init() {
            map = OlMap.map;
        }

        OlMap.loaded().then(init);
    }]
}