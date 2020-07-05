import {Component} from '@angular/core';
import {HsMapService} from '../map/map.service.js';
import {HsSensorUnit} from './sensor-unit.class';
import {HsSensorsService} from './sensors.service';
@Component({
  selector: 'hs-sensors',
  template: require('./partials/panel.html'),
})
export class HsSensorsComponent {
  viewMode = 'sensors';
  viewExpanded = false;

  constructor(
    private HsMapService: HsMapService,
    private HsSensorsService: HsSensorsService
  ) {
    this.HsMapService.loaded().then(() => this.init());
  }

  /**
   * @memberof hs.sensors.component
   * @function init
   * @description Init function used to populate list of units and later
   * create some map functionality
   */
  init() {
    this.HsSensorsService.getUnits();
  }

  setViewMode(viewMode) {
    this.viewMode = viewMode;
  }

  toggleExpansion() {
    this.viewExpanded = !this.viewExpanded;
    if (!this.viewExpanded) {
      this.HsSensorsService.units.forEach((element: HsSensorUnit) => {
        element.expanded = false;
      });
    }
  }
}
