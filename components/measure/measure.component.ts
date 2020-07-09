import {Component} from '@angular/core';

@Component({
  selector: 'hs-measure',
  template: require('./partials/measure.html'),
})
export class HsMeasureComponent {
  /*if (HsConfig.design == 'md') {
    return require('./partials/measuremd.html');
  }*/
  type = 'distance';

  constructor(
    $scope,
    private HsLayoutService,
    private HsMeasureService,
    $timeout
  ) {
    'ngInject';
    $scope.data = this.HsMeasureService.data;

    document.addEventListener('keyup', (e) => {
      if (e.keyCode == 17) {
        //ControlLeft
        $timeout(() => {
          this.HsMeasureService.switchMultipleMode();
        }, 0);
      }
    });

    $scope.$on('measure.drawStart', () => {
      this.HsLayoutService.panelEnabled('toolbar', false);
    });

    $scope.$on('measure.drawEnd', () => {
      this.HsLayoutService.panelEnabled('toolbar', true);
    });

    $scope.$watch('type', () => {
      if (this.HsLayoutService.mainpanel != 'measure') {
        return;
      }
      this.HsMeasureService.changeMeasureParams($scope.type);
    });

    $scope.$on('core.mainpanel_changed', (event) => {
      if (HsLayoutService.mainpanel == 'measure') {
        this.HsMeasureService.activateMeasuring($scope.type);
      } else {
        this.HsMeasureService.deactivateMeasuring();
      }
    });

    //Temporary fix when measure panel is loaded as deafult (e.g. reloading page with parameters in link)
    if (this.HsLayoutService.mainpanel == 'measure') {
      this.HsMeasureService.activateMeasuring($scope.type);
    }

    $scope.$emit('scope_loaded', 'Measure');
  }

  /**
   * @memberof hs.measure.controller
   * @function setType
   * @public
   * @param {string} type type of measure to use, should be "area" or "distance"
   * @returns {object} area of polygon with used units
   * @description Set type of current measurment
   */
  setType(type) {
    this.type = type;
    this.HsMeasureService.switchMeasureType(type);
  }

  /**
   * @memberof hs.measure.controller
   * @function clearAll
   * @public
   * @param {string} type type of measure to use, should be "area" or "distance"
   * @returns {object} area of polygon with used units
   * @description Reset sketch and all measurements to start new drawing
   */
  clearAll() {
    this.HsMeasureService.clearMeasurement();
  }
}
