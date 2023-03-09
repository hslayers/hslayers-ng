import {Component, OnInit, ViewRef} from '@angular/core';
import {HsLayoutService} from 'hslayers-ng';
import {HsMapService} from 'hslayers-ng';
import {HsPanelBaseComponent} from 'hslayers-ng';
import {HsSensorUnit} from './sensor-unit.class';
import {HsSensorsService} from './sensors.service';
@Component({
  selector: 'hs-sensors',
  templateUrl: './partials/sensors.component.html',
})
export class HsSensorsComponent extends HsPanelBaseComponent implements OnInit {
  viewMode = 'sensors';
  viewExpanded = false;
  query: any = {description: ''};
  viewRef: ViewRef;
  name = 'sensors';

  constructor(
    private hsMapService: HsMapService,
    private hsSensorsService: HsSensorsService,
    public hsLayoutService: HsLayoutService
  ) {
    super(hsLayoutService);
  }
  ngOnInit(): void {
    this.hsMapService.loaded().then(() => {
      this.hsSensorsService.init();
      this.init();
    });
  }

  /**
   * Init function used to populate list of units and later
   * create some map functionality
   */
  init(): void {
    if (this.data.viewMode) {
      this.setViewMode(this.data.viewMode);
    }
    this.hsSensorsService.getUnits();
  }

  /**
   * Set data view mode
   */
  setViewMode(viewMode): void {
    this.viewMode = viewMode;
  }

  /**
   * Toggle unit data expansion
   */
  toggleExpansion(): void {
    this.viewExpanded = !this.viewExpanded;
    if (!this.viewExpanded) {
      this.hsSensorsService
        .get()
        .units.forEach((element: HsSensorUnit) => {
          element.expanded = false;
        });
    }
  }

  /**
   * Check if panel is visible
   */
  isVisible() {
    return this.hsLayoutService.panelVisible('sensors');
  }

  /**
   * Filter sensors list with query value
   */
  filterQuery(query) {
    return this.hsSensorsService.filterquery(
      this.hsSensorsService.get().units,
      query
    );
  }
}
