import {Component, Input} from '@angular/core';

import {HsDatasourcesService} from './datasource-selector.service';

@Component({
  selector: 'hs-select-type-to-add-layer',
  template: require('./partials/select-type-to-add-layer-dialog.html'),
})
export class HsSelectTypeToAddLayerDialogComponent {
  @Input() layer;
  @Input() types;
  @Input() endpoint;

  modalVisible;
  alertChoose;
  layerType; //do not rename to 'type', would clash in the template

  constructor(public hsDatasourcesService: HsDatasourcesService) {
    this.modalVisible = true;
  }

  add(): void {
    if (this.layerType === undefined) {
      this.alertChoose = true;
    } else {
      this.modalVisible = false;
      this.hsDatasourcesService.addLayerToMap(
        this.endpoint,
        this.layer,
        this.layerType
      );
    }
  }
}
