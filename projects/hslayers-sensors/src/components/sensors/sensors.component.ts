import {Component, ViewRef} from '@angular/core';
import {HsLayoutService} from 'hslayers-ng';
import {HsMapService} from 'hslayers-ng';
import {HsPanelComponent} from 'hslayers-ng';
import {HsSensorUnit} from './sensor-unit.class';
import {HsSensorsService} from './sensors.service';
@Component({
  selector: 'hs-sensors',
  templateUrl: './partials/panel.html',
})
export class HsSensorsComponent implements HsPanelComponent {
  viewMode = 'sensors';
  viewExpanded = false;
  query: any = {description: ''};
  constructor(
    public HsMapService: HsMapService,
    public HsSensorsService: HsSensorsService,
    public HsLayoutService: HsLayoutService
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
