export default {
  template: require('./partials/unit-dialog.html'),
  bindings: {
    unit: '=',
  },
  controller: function (
    $scope,
    HsMapService,
    HsSensorsService,
    HsLayoutService
  ) {
    'ngInject';
    HsSensorsService.unitDialogVisible = true;
    angular.extend($scope, {
      sensorsService: HsSensorsService,
      intervals: [
        {name: '1H', amount: 1, unit: 'hours'},
        {name: '1D', amount: 1, unit: 'days'},
        {name: '1W', amount: 1, unit: 'weeks'},
        {name: '1M', amount: 1, unit: 'months'},
        {name: '6M', amount: 6, unit: 'months'},
      ],
      customInterval: {name: 'Custom', fromTime: new Date()},
      loaderImage: require('../../img/ajax-loader.gif'),

      /**
       * @memberof hs.sensors.unitDialog
       * @function sensorClicked
       * @param {object} sensor Clicked sensor
       * @description Regenerate chart for sensor is clicked. If no
       * interval was clicked before use 1 day timeframe by default.
       */
      sensorClicked(sensor) {
        HsSensorsService.selectSensor(sensor);
        if (angular.isUndefined(HsSensorsService.currentInterval)) {
          $scope.timeButtonClicked({amount: 1, unit: 'days'});
        } else {
          HsSensorsService.createChart($scope.$ctrl.unit);
        }
      },

      /**
       * @memberof hs.sensors.unitDialog
       * @function timeButtonClicked
       * @param {object} interval Clicked interval button
       * @description Get data for different time interval and regenerate
       * chart
       */
      timeButtonClicked(interval) {
        HsSensorsService.currentInterval = interval;
        $scope.customInterval.fromTime = HsSensorsService.getTimeForInterval(
          interval
        ).toDate();
        HsSensorsService.getObservationHistory(
          HsSensorsService.unit,
          interval
        ).then((_) => {
          HsSensorsService.createChart(HsSensorsService.unit);
        });
      },

      customIntervalChanged() {
        HsSensorsService.currentInterval = $scope.customInterval;
        HsSensorsService.getObservationHistory(
          HsSensorsService.unit,
          $scope.customInterval
        ).then((_) => HsSensorsService.createChart(HsSensorsService.unit));
      },

      dialogStyle() {
        return {
          'visibility': HsSensorsService.unitDialogVisible
            ? 'visible'
            : 'hidden',
          'left': HsLayoutService.sidebarBottom()
            ? '3px'
            : HsLayoutService.panelSpaceWidth() + 10 + 'px',
          'width': HsLayoutService.sidebarBottom()
            ? '100%'
            : 'calc(' + HsLayoutService.widthWithoutPanelSpace() + ')',
          'bottom': HsLayoutService.sidebarBottom() ? '46.5em' : '0',
          'height': HsLayoutService.sidebarBottom() ? '5em' : 'auto',
        };
      },
    });

    /**
     *
     */
    function init() {}

    HsMapService.loaded().then(init);
  },
};
