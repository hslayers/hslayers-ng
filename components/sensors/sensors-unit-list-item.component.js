export default {
  template: require('./partials/unit-list-item.html'),
  bindings: {
    unit: '=',
    expanded: '=',
    viewMode: '=',
  },
  controller: function (
    $scope,
    HsMapService,
    HsSensorsService,
    $compile,
    $timeout,
    HsLayoutService
  ) {
    'ngInject';
    angular.extend($scope, {
      sensorsService: HsSensorsService,

      /**
       * @memberof hs.sensors.unitListItem
       * @function unitClicked
       * @description When unit is clicked, create a dialog window for
       * displaying charts or reopen already existing one.
       */
      unitClicked() {
        HsSensorsService.selectUnit($scope.$ctrl.unit);
      },

      /**
       * @memberof hs.sensors.unitListItem
       * @function sensorClicked
       * @param {object} sensor Clicked sensor
       * @description When sensor is clicked, create a dialog window for
       * displaying charts or reopen already existing one.
       */
      sensorClicked(sensor) {
        HsSensorsService.unit = $scope.$ctrl.unit;
        HsSensorsService.selectSensor(sensor);
        generateDialog();
      },

      /**
       * @memberof hs.sensors.unitListItem
       * @function sensorToggleSelected
       * @param {object} sensor Clicked to be toggled
       * @description When sensor is toggled, create a dialog window for
       * displaying charts or reopen already existing one.
       */
      sensorToggleSelected(sensor) {
        HsSensorsService.unit = $scope.$ctrl.unit;
        sensor.checked = !sensor.checked;
        HsSensorsService.toggleSensor(sensor);
        generateDialog();
      },
    });

    /**
     *
     */
    function generateDialog() {
      if (
        !HsLayoutService.contentWrapper.querySelector('.hs-sensor-unit-dialog')
      ) {
        const dir = 'hs.sensors.unit-dialog';
        const html = `<${dir} 
                    unit="sensorsService.unit"W
                    ></${dir}>`;
        const element = angular.element(html)[0];
        HsLayoutService.contentWrapper
          .querySelector('.hs-dialog-area')
          .appendChild(element);
        $compile(element)($scope);
      } else {
        HsSensorsService.unitDialogVisible = true;
      }
      $timeout((_) => {
        HsSensorsService.createChart(HsSensorsService.unit);
      }, 0);
    }

    /**
     *
     */
    function init() {}

    HsMapService.loaded().then(init);
  },
};
