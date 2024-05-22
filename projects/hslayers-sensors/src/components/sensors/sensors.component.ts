import {Component, OnInit, ViewRef} from '@angular/core';
import {HsPanelBaseComponent} from 'hslayers-ng/common/panels';

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
    public hsSensorsService: HsSensorsService,
    public hsSensorsUnitDialogService: HsSensorsUnitDialogService,
  ) {
    super();
  }

  ngOnInit(): void {
    super.ngOnInit();
    if (this.data.viewMode) {
      this.setViewMode(this.data.viewMode);
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
      this.hsSensorsUnitDialogService.createChart$.next([
        this.hsSensorsUnitDialogService.unit,
        false,
      ]);
    }
  }

  /**
   * Set data view mode
   */
  setViewMode(viewMode: string): void {
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
