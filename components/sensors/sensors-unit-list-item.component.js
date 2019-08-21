export default {
    template: require('./partials/unit-list-item.html'),
    bindings: {
        unit: '='
    },
    controller: ['$scope', 'hs.map.service', 'hs.sensors.service', '$compile', function ($scope, OlMap, sensorsService, $compile) {
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
                if (document.querySelector('#sensor-unit-dialog') == null) {
                    const dir = 'hs.sensors.unit-dialog';
                    const html = `<${dir} unit="sensorsService.unit"></${dir}>`;
                    const element = angular.element(html)[0];
                    document.querySelector(".gui-overlay").appendChild(element);
                    $compile(element)($scope);
                } else {
                    sensorsService.unitDialogVisible = true;
                }
            }
        });

        function init() {
            map = OlMap.map;
        }

        OlMap.loaded().then(init);
    }]
}