export default {
  template: (HsConfig) => {
    'ngInject';
    if (HsConfig.design == 'md') {
      return require('./partials/measuremd.html');
    } else {
      return require('./partials/measure.html');
    }
  },
  controller: function ($scope, HsLayoutService, HsMeasureService, $timeout) {
    'ngInject';
    $scope.data = HsMeasureService.data;

    document.addEventListener('keyup', (e) => {
      if (e.keyCode == 17) {
        //ControlLeft
        $timeout(() => {
          HsMeasureService.switchMultipleMode();
        }, 0);
      }
    });

    $scope.$on('measure.drawStart', () => {
      HsLayoutService.panelEnabled('toolbar', false);
    });

    $scope.$on('measure.drawEnd', () => {
      HsLayoutService.panelEnabled('toolbar', true);
    });

    $scope.type = 'distance';

    /**
     * @memberof hs.measure.controller
     * @function setType
     * @public
     * @param {string} type type of measure to use, should be "area" or "distance"
     * @returns {object} area of polygon with used units
     * @description Set type of current measurment
     */
    $scope.setType = function (type) {
      $scope.type = type;
      HsMeasureService.switchMeasureType(type);
    };

    /**
     * @memberof hs.measure.controller
     * @function clearAll
     * @public
     * @param {string} type type of measure to use, should be "area" or "distance"
     * @returns {object} area of polygon with used units
     * @description Reset sketch and all measurements to start new drawing
     */
    $scope.clearAll = function () {
      HsMeasureService.clearMeasurement();
    };

    $scope.$watch('type', () => {
      if (HsLayoutService.mainpanel != 'measure') {
        return;
      }
      HsMeasureService.changeMeasureParams($scope.type);
    });

    $scope.$on('core.mainpanel_changed', (event) => {
      if (HsLayoutService.mainpanel == 'measure') {
        HsMeasureService.activateMeasuring($scope.type);
      } else {
        HsMeasureService.deactivateMeasuring();
      }
    });

    //Temporary fix when measure panel is loaded as deafult (e.g. reloading page with parameters in link)
    if (HsLayoutService.mainpanel == 'measure') {
      HsMeasureService.activateMeasuring($scope.type);
    }

    $scope.$emit('scope_loaded', 'Measure');
  },
};
