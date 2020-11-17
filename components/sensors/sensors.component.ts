import {Component, ViewRef} from '@angular/core';
import {HsLayoutService} from '../layout/layout.service';
import {HsMapService} from '../map/map.service';
import {HsPanelComponent} from '../layout/panels/panel-component.interface';
import {HsSensorUnit} from './sensor-unit.class';
import {HsSensorsService} from './sensors.service';
@Component({
  selector: 'hs-sensors',
  template: require('./partials/panel.html'),
})
export class HsSensorsComponent implements HsPanelComponent {
  viewMode = 'sensornames';
  viewExpanded = false;
  query: any = {description: ''};
  constructor(
    private HsMapService: HsMapService,
    private HsSensorsService: HsSensorsService,
    private HsLayoutService: HsLayoutService
  ) {
    this.HsMapService.loaded().then(() => this.init());
  }
  viewRef: ViewRef;
  data: any;

  /**
   * @memberof hs.sensors.component
   * @function init
   * @description Init function used to populate list of units and later
   * create some map functionality
   */
  init(): void {
    this.HsSensorsService.getUnits();
  }

  setViewMode(viewMode): void {
    this.viewMode = viewMode;
  }

  toggleExpansion(): void {
    this.viewExpanded = !this.viewExpanded;
    if (!this.viewExpanded) {
      this.HsSensorsService.units.forEach((element: HsSensorUnit) => {
        element.expanded = false;
      });
    }
  }

  isVisible() {
    return this.HsLayoutService.panelVisible('sensors');
  }
}
