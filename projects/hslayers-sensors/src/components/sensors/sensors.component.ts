import {Component, OnInit, ViewRef} from '@angular/core';
import {HsLayoutService} from 'hslayers-ng';
import {HsMapService} from 'hslayers-ng';
import {HsPanelBaseComponent} from 'hslayers-ng';
import {HsSensorUnit} from './sensor-unit.class';
import {HsSensorsService} from './sensors.service';
@Component({
  selector: 'hs-sensors',
  templateUrl: './partials/panel.html',
})
export class HsSensorsComponent extends HsPanelBaseComponent implements OnInit {
  viewMode = 'sensors';
  viewExpanded = false;
  query: any = {description: ''};
  viewRef: ViewRef;
  data: {viewMode?: string};
  name = 'sensors';

  constructor(
    public HsMapService: HsMapService,
    public HsSensorsService: HsSensorsService,
    public HsLayoutService: HsLayoutService
  ) {
    super(HsLayoutService);
  }
  ngOnInit(): void {
    this.HsMapService.loaded(this.data.app).then(() => this.init());
  }

  /**
   * Init function used to populate list of units and later
   * create some map functionality
   */
  init(): void {
    if (this.data.viewMode) {
      this.setViewMode(this.data.viewMode);
    }
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
