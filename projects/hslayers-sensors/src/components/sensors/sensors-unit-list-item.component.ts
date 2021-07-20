import {Component, Input} from '@angular/core';
import {HsDialogContainerService} from 'hslayers-ng';
import {HsSensorUnit} from './sensor-unit.class';
import {HsSensorsService} from './sensors.service';
import {HsSensorsUnitDialogComponent} from './sensors-unit-dialog.component';
import {HsSensorsUnitDialogService} from './unit-dialog.service';

@Component({
  selector: 'hs-sensor-unit-list-item',
  templateUrl: './partials/unit-list-item.html',
})
export class HsSensorsUnitListItemComponent {
  @Input() unit: HsSensorUnit;
  @Input() expanded: boolean;
  @Input('view-mode') viewMode: string;

  constructor(
    public HsSensorsService: HsSensorsService,
    public HsDialogContainerService: HsDialogContainerService,
    public HsSensorsUnitDialogService: HsSensorsUnitDialogService
  ) {}

  /**
   * @description When unit is clicked, create a dialog window for
   * displaying charts or reopen already existing one.
   */
  unitClicked(): void {
    this.HsSensorsService.selectUnit(this.unit);
  }

  /**
   * @param {object} sensor Clicked sensor
   * @description When sensor is clicked, create a dialog window for
   * displaying charts or reopen already existing one.
   */
  sensorClicked(sensor): void {
    this.HsSensorsUnitDialogService.unit = this.unit;
    this.HsSensorsService.selectSensor(sensor);
    this.generateDialog();
  }

  /**
   * @param {object} sensor Clicked to be toggled
   * @description When sensor is toggled, create a dialog window for
   * displaying charts or reopen already existing one.
   */
  sensorToggleSelected(sensor): void {
    this.HsSensorsUnitDialogService.unit = this.unit;
    sensor.checked = !sensor.checked;
    this.HsSensorsUnitDialogService.toggleSensor(sensor);
    this.generateDialog();
  }

  generateDialog(): void {
    if (!this.HsSensorsUnitDialogService.unitDialogVisible) {
      this.HsDialogContainerService.create(HsSensorsUnitDialogComponent, {});
    } else {
      this.HsSensorsUnitDialogService.createChart(
        this.HsSensorsUnitDialogService.unit
      );
    }
  }
}
