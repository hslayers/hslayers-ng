import {Component, OnInit, ViewRef} from '@angular/core';
import {HsConfig, HsLayoutService} from 'hslayers-ng';
import {HsMapService} from 'hslayers-ng';
import {HsPanelBaseComponent} from 'hslayers-ng';
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

  comparisonAllowed: boolean;
  unitDialogServiceRef;
  constructor(
    private hsMapService: HsMapService,
    private hsSensorsService: HsSensorsService,
    public hsLayoutService: HsLayoutService,
    public hsSensorsUnitDialogService: HsSensorsUnitDialogService,
    private hsConfig: HsConfig
  ) {
    super(hsLayoutService);
  }
  ngOnInit(): void {
    this.hsMapService.loaded(this.data.app).then(() => {
      this.hsSensorsService.init(this.data.app);
      this.init();
    });

    this.unitDialogServiceRef = this.hsSensorsUnitDialogService.get(
      this.data.app
    );
  }

  toggleComparisonAllowed(): void {
    this.unitDialogServiceRef.comparisonAllowed =
      !this.unitDialogServiceRef.comparisonAllowed;
    /**
     * If multi comparison was disabled refresh state and chart(keeping first one)
     */
    if (!this.unitDialogServiceRef.comparisonAllowed) {
      this.unitDialogServiceRef.unit
        .filter((u) => u.unit_id != this.unitDialogServiceRef.unit[0].unit_id)
        .forEach((u) => this.hsSensorsService.deselectUnit(u, this.data.app));
      this.hsSensorsUnitDialogService.createChart(
        this.unitDialogServiceRef.unit,
        this.data.app
      );
    }
  }

  /**
   * Init function used to populate list of units and later
   * create some map functionality
   */
  init(): void {
    if (this.data.viewMode) {
      this.setViewMode(this.data.viewMode);
    }
    if (this.hsConfig.get(this.data.app)?.senslog) {
      this.hsSensorsService.getUnits(this.data.app);
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
      this.hsSensorsService
        .get(this.data.app)
        .units.forEach((element: HsSensorUnit) => {
          element.expanded = false;
        });
    }
  }

  /**
   * Check if panel is visible
   */
  isVisible() {
    return this.hsLayoutService.panelVisible('sensors', this.data.app);
  }

  /**
   * Filter sensors list with query value
   */
  filterQuery(query) {
    return this.hsSensorsService.filterquery(
      this.hsSensorsService.get(this.data.app).units,
      query
    );
  }
}
