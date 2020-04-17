export default {
  template: [
    'config',
    (config) => {
      if (config.design == 'md') {
        return require('components/measure/partials/measuremd.html');
      } else {
        return require('components/measure/partials/measure.html');
      }
    },
  ],
  controller: [
    '$scope',
    'hs.map.service',
    'hs.layout.service',
    'hs.measure.service',
    '$timeout',
    function ($scope, OlMap, layoutService, Measure, $timeout) {
      $scope.data = Measure.data;

      document.addEventListener('keyup', (e) => {
        if (e.keyCode == 17) {
          //ControlLeft
          $timeout(() => {
            Measure.switchMultipleMode();
          }, 0);
        }
      });

      $scope.$on('measure.drawStart', () => {
        layoutService.panelEnabled('toolbar', false);
      });

      $scope.$on('measure.drawEnd', () => {
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
      };

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
      };

      $scope.$watch('type', () => {
        if (layoutService.mainpanel != 'measure') {
          return;
        }
        Measure.changeMeasureParams($scope.type);
      });

      $scope.$on('core.mainpanel_changed', (event) => {
        if (layoutService.mainpanel == 'measure') {
          Measure.activateMeasuring($scope.type);
        } else {
          Measure.deactivateMeasuring();
        }
      });

      //Temporary fix when measure panel is loaded as deafult (e.g. reloading page with parameters in link)
      if (layoutService.mainpanel == 'measure') {
        Measure.activateMeasuring($scope.type);
      }

      $scope.$emit('scope_loaded', 'Measure');
    },
  ],
};
