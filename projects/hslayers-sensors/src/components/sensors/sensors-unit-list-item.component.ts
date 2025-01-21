import {Component, Input} from '@angular/core';

import {HsDialogContainerService} from 'hslayers-ng/common/dialogs';

import {HsSensorUnit} from './sensor-unit.class';
import {HsSensorsService} from './sensors.service';
import {HsSensorsUnitDialogComponent} from './sensors-unit-dialog.component';
import {HsSensorsUnitDialogService} from './unit-dialog.service';
import {SenslogSensor} from './types/senslog-sensor.type';

@Component({
  selector: 'hs-sensor-unit-list-item',
  templateUrl: './partials/unit-list-item.component.html',
  standalone: false,
})
export class HsSensorsUnitListItemComponent {
  @Input() unit: HsSensorUnit;
  @Input() expanded: boolean;
  @Input('view-mode') viewMode: string;

  constructor(
    private hsSensorsService: HsSensorsService,
    private hsDialogContainerService: HsDialogContainerService,
    private hsSensorsUnitDialogService: HsSensorsUnitDialogService,
  ) {}

  /**
   * When unit is clicked, create a dialog window for
   * displaying charts or reopen already existing one.
   */
  unitClicked(): void {
    this.hsSensorsService.selectUnit(this.unit);
  }

  /**
   * @param sensor - Clicked sensor
   * When sensor is clicked, create a dialog window for
   * displaying charts or reopen already existing one.
   */
  sensorClicked(sensor: SenslogSensor): void {
    this.hsSensorsUnitDialogService.resetAggregations();
    this.hsSensorsUnitDialogService.unit = [this.unit];
    this.generateDialog();
  }

  /**
   * @param sensor - Clicked to be toggled
   * When sensor is toggled, create a dialog window for
   * displaying charts or reopen already existing one.
   */
  sensorToggleSelected(sensor: SenslogSensor): void {
    sensor.checked = !sensor.checked;
    if (this.hsSensorsUnitDialogService.comparisonAllowed) {
      //If the opened sensor belongs to unit that's not included add it
      //NOTE: Might not even be possible as checkboxes are available only after unit is selected
      if (
        !this.hsSensorsUnitDialogService.unit.find(
          (u) => u.unit_id === sensor.unit_id,
        )
      ) {
        this.hsSensorsUnitDialogService.unit.push(this.unit);
      }
    } else {
      this.hsSensorsUnitDialogService.unit = [this.unit];
    }

    this.hsSensorsUnitDialogService.toggleSensor(sensor);
    this.generateDialog(!this.hsSensorsUnitDialogService.comparisonAllowed);
  }

  /**
   * Display sensors unit dialog
   * @param single Controls whether only one unit is supposed to be selected
   */
  generateDialog(single = true): void {
    if (!this.hsSensorsUnitDialogService.unitDialogVisible) {
      this.hsDialogContainerService.create(HsSensorsUnitDialogComponent, {});
    } else {
      this.hsSensorsUnitDialogService.createChart$.next(
        single
          ? this.hsSensorsUnitDialogService.unit[0]
          : this.hsSensorsUnitDialogService.unit,
      );
    }
  }
}
