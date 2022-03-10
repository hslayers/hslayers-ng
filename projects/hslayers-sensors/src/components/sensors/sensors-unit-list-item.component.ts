import {Component, Input} from '@angular/core';

import {HsDialogContainerService} from 'hslayers-ng';

import {HsSensorUnit} from './sensor-unit.class';
import {HsSensorsService} from './sensors.service';
import {HsSensorsUnitDialogComponent} from './sensors-unit-dialog.component';
import {HsSensorsUnitDialogService} from './unit-dialog.service';

@Component({
  selector: 'hs-sensor-unit-list-item',
  templateUrl: './partials/unit-list-item.component.html',
})
export class HsSensorsUnitListItemComponent {
  @Input() unit: HsSensorUnit;
  @Input() expanded: boolean;
  @Input('view-mode') viewMode: string;
  @Input() app = 'default';

  constructor(
    private hsSensorsService: HsSensorsService,
    private hsDialogContainerService: HsDialogContainerService,
    private hsSensorsUnitDialogService: HsSensorsUnitDialogService
  ) {}

  /**
   * When unit is clicked, create a dialog window for
   * displaying charts or reopen already existing one.
   */
  unitClicked(): void {
    this.hsSensorsService.selectUnit(this.unit, this.app);
  }

  /**
   * @param sensor - Clicked sensor
   * When sensor is clicked, create a dialog window for
   * displaying charts or reopen already existing one.
   */
  sensorClicked(sensor): void {
    this.hsSensorsUnitDialogService.get(this.app).unit = this.unit;
    this.hsSensorsService.selectSensor(sensor, this.app);
    this.generateDialog();
  }

  /**
   * Get data translation to local
   * @param text - Text to translate
   * @param module - Locales json object where to look for the translation
   */
  getTranslation(text: string, module?: string): string {
    return this.hsSensorsUnitDialogService.translate(text, module);
  }

  /**
   * @param sensor - Clicked to be toggled
   * When sensor is toggled, create a dialog window for
   * displaying charts or reopen already existing one.
   */
  sensorToggleSelected(sensor): void {
    this.hsSensorsUnitDialogService.get(this.app).unit = this.unit;
    sensor.checked = !sensor.checked;
    this.hsSensorsUnitDialogService.toggleSensor(sensor, this.app);
    this.generateDialog();
  }

  /**
   * Display sensors unit dialog
   */
  generateDialog(): void {
    if (!this.hsSensorsUnitDialogService.get(this.app).unitDialogVisible) {
      this.hsDialogContainerService.create(
        HsSensorsUnitDialogComponent,
        {},
        this.app
      );
    } else {
      this.hsSensorsUnitDialogService.createChart(
        this.hsSensorsUnitDialogService.get(this.app).unit,
        this.app
      );
    }
  }
}
