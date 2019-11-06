export default {
    template: ['config', (config) => {
        if (config.design == 'md')
            return require('components/measure/partials/measuremd.html')
        else
            return require('components/measure/partials/measure.html')
    }],
    controller: ['$scope', 'hs.map.service', 'hs.layout.service', 'hs.measure.service',
        function ($scope, OlMap, layoutService, Measure) {
            $scope.data = Measure.data;

            document.addEventListener('keyup', function (e) {
                if (e.keyCode == 17) { //ControlLeft
                    Measure.switchMultipleMode();
                    if (!$scope.$$phase) $scope.$digest();
                }
            });

            $scope.$on('measure.drawStart', function () {
                layoutService.panelEnabled('toolbar', false);
            });

            $scope.$on('measure.drawEnd', function () {
                layoutService.panelEnabled('toolbar', true);
            });

            $scope.type = 'distance';

            /**
             * @memberof hs.measure.controller
             * @function setType
             * @public
             * @param {string} type type of measure to use, should be "area" or "distance"
             * @return {object} area of polygon with used units
             * @description Set type of current measurment
             */
            $scope.setType = function (type) {
                $scope.type = type;
                Measure.switchMeasureType(type);
                if (!$scope.$$phase) $scope.$digest();
            }

            /**
             * @memberof hs.measure.controller
             * @function clearAll
             * @public
             * @param {string} type type of measure to use, should be "area" or "distance"
             * @return {object} area of polygon with used units
             * @description Reset sketch and all measurements to start new drawing
             */
            $scope.clearAll = function () {
                Measure.clearMeasurement();
                if (!$scope.$$phase) $scope.$digest();
            }

            $scope.$watch('type', function () {
                if (layoutService.mainpanel != 'measure') return;
                Measure.changeMeasureParams($scope.type);
            });

            $scope.$on('core.mainpanel_changed', function (event) {
                if (layoutService.mainpanel == 'measure') {
                    Measure.activateMeasuring($scope.type);
                } else {
                    Measure.deactivateMeasuring();
                }
            });

            //Temporary fix when measure panel is loaded as deafult (e.g. reloading page with parameters in link)
            if (layoutService.mainpanel == "measure") {
                Measure.activateMeasuring($scope.type);
            }

            $scope.$emit('scope_loaded', "Measure");
        }
    ]
}