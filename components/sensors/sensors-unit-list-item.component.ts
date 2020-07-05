import {Component, Input} from '@angular/core';
import {HsDialogContainerService} from '../layout/dialog-container.service';
import {HsMapService} from '../map/map.service.js';
import {HsSensorUnit} from './sensor-unit.class';
import {HsSensorsService} from './sensors.service';
import {HsSensorsUnitDialogComponent} from './sensors-unit-dialog.component';
import {HsSensorsUnitDialogService} from './unit-dialog.service';

@Component({
  selector: 'hs-sensor-unit-list-item',
  template: require('./partials/unit-list-item.html'),
})
export class HsSensorsUnitListItemComponent {
  @Input() unit: HsSensorUnit;
  @Input() expanded: boolean;
  @Input() viewMode: string;

  constructor(
    private HsSensorsService: HsSensorsService,
    private HsDialogContainerService: HsDialogContainerService,
    private HsSensorsUnitDialogService: HsSensorsUnitDialogService
  ) {}

  /**
   * @memberof hs.sensors.unitListItem
   * @function unitClicked
   * @description When unit is clicked, create a dialog window for
   * displaying charts or reopen already existing one.
   */
  unitClicked() {
    this.HsSensorsService.selectUnit(this.unit);
  }

  /**
   * @memberof hs.sensors.unitListItem
   * @function sensorClicked
   * @param {object} sensor Clicked sensor
   * @description When sensor is clicked, create a dialog window for
   * displaying charts or reopen already existing one.
   */
  sensorClicked(sensor) {
    this.HsSensorsUnitDialogService.unit = this.unit;
    this.HsSensorsService.selectSensor(sensor);
    this.generateDialog();
  }

  /**
   * @memberof hs.sensors.unitListItem
   * @function sensorToggleSelected
   * @param {object} sensor Clicked to be toggled
   * @description When sensor is toggled, create a dialog window for
   * displaying charts or reopen already existing one.
   */
  sensorToggleSelected(sensor) {
    this.HsSensorsUnitDialogService.unit = this.unit;
    sensor.checked = !sensor.checked;
    this.HsSensorsUnitDialogService.toggleSensor(sensor);
    this.generateDialog();
  }

  /**
   *
   */
  generateDialog() {
    if (!this.HsSensorsUnitDialogService.unitDialogVisible) {
      this.HsDialogContainerService.create(HsSensorsUnitDialogComponent, {});
    } else {
      this.HsSensorsUnitDialogService.unitDialogVisible = true;
    }
    this.HsSensorsUnitDialogService.createChart(
      this.HsSensorsUnitDialogService.unit
    );
  }
}
