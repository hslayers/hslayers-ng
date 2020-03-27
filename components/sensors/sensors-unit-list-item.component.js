export default {
  template: require('./partials/unit-list-item.html'),
  bindings: {
    unit: '=',
    expanded: '=',
    viewMode: '='
  },
  controller: ['$scope', 'hs.map.service', 'hs.sensors.service', '$compile', '$timeout', 'hs.layout.service', function ($scope, OlMap, sensorsService, $compile, $timeout, layoutService) {
    angular.extend($scope, {
      sensorsService,

      /**
       * @memberof hs.sensors.unitListItem
       * @function unitClicked
       * @description When unit is clicked, create a dialog window for
       * displaying charts or reopen already existing one.
       */
      unitClicked() {
        sensorsService.selectUnit($scope.$ctrl.unit);
      },

      /**
       * @memberof hs.sensors.unitListItem
       * @function sensorClicked
       * @param {Object} sensor Clicked sensor
       * @description When sensor is clicked, create a dialog window for
       * displaying charts or reopen already existing one.
       */
      sensorClicked(sensor) {
        sensorsService.unit = $scope.$ctrl.unit;
        sensorsService.selectSensor(sensor);
        generateDialog();
      },

      /**
       * @memberof hs.sensors.unitListItem
       * @function sensorToggleSelected
       * @param {Object} sensor Clicked to be toggled
       * @description When sensor is toggled, create a dialog window for
       * displaying charts or reopen already existing one.
       */
      sensorToggleSelected(sensor) {
        sensorsService.unit = $scope.$ctrl.unit;
        sensor.checked = !sensor.checked;
        sensorsService.toggleSensor(sensor);
        generateDialog();
      }
    });

    function generateDialog() {
      if (!layoutService.contentWrapper.querySelector('.hs-sensor-unit-dialog')) {
        const dir = 'hs.sensors.unit-dialog';
        const html = `<${dir} 
                    unit="sensorsService.unit"W
                    ></${dir}>`;
        const element = angular.element(html)[0];
        layoutService.contentWrapper.querySelector('.hs-gui-overlay').appendChild(element);
        $compile(element)($scope);
      } else {
        sensorsService.unitDialogVisible = true;
      }
      $timeout(_ => {
        sensorsService.createChart(sensorsService.unit);
      }, 0);
    }

    function init() {
    }

    OlMap.loaded().then(init);
  }]
};
