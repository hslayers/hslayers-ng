import {Component, OnInit, ViewRef} from '@angular/core';
import {
  HsConfig,
  HsLayoutService,
  HsMapService,
  HsPanelBaseComponent,
} from 'hslayers-ng';

import {HsSensorUnit} from './sensor-unit.class';
import {HsSensorsService} from './sensors.service';
import {HsSensorsUnitDialogService} from './unit-dialog.service';
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
    private hsConfig: HsConfig,
    private hsSensorsService: HsSensorsService,
    public hsLayoutService: HsLayoutService,
    public hsSensorsUnitDialogService: HsSensorsUnitDialogService,
  ) {
    super(hsLayoutService);
  }

  ngOnInit(): void {
    if (this.data.viewMode) {
      this.setViewMode(this.data.viewMode);
    }
    if (this.hsConfig.senslog) {
      this.hsSensorsService.getUnits();
    }
  }

  toggleComparisonAllowed(): void {
    this.hsSensorsUnitDialogService.comparisonAllowed =
      !this.hsSensorsUnitDialogService.comparisonAllowed;
    /**
     * If multi comparison was disabled refresh state and chart(keeping first one)
     */
    if (!this.hsSensorsUnitDialogService.comparisonAllowed) {
      this.hsSensorsUnitDialogService.unit
        .filter(
          (u) => u.unit_id != this.hsSensorsUnitDialogService.unit[0].unit_id,
        )
        .forEach((u) => this.hsSensorsService.deselectUnit(u));
      this.hsSensorsUnitDialogService.createChart(
        this.hsSensorsUnitDialogService.unit,
      );
    }
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
      this.hsSensorsService.units.forEach((element: HsSensorUnit) => {
        element.expanded = false;
      });
    }
  }

  /**
   * Filter sensors list with query value
   */
  filterQuery(query) {
    return this.hsSensorsService.filterquery(
      this.hsSensorsService.units,
      query,
    );
  }
}
