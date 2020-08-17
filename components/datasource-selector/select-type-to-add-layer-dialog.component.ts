import {Component, Input, OnInit} from '@angular/core';
import {HsDatasourcesService} from './datasource-selector.service';

@Component({
  selector: 'selector-name',
  template: require('./partials/select-type-to-add-layer-dialog.html'),
})
export class HsSelectTypeToAddLayerDialogComponent implements OnInit {
  @Input() layer;
  @Input() types;
  @Input() endpoint;

  modalVisible;
  alertChoose;
  type;

  constructor(private hsDatasourcesService: HsDatasourcesService) {
    'ngInject';
    this.modalVisible = true;
  }

  add(): void {
    if (this.type === undefined) {
      this.alertChoose = true;
    } else {
      this.modalVisible = false;
      this.hsDatasourcesService.addLayerToMap(
        this.endpoint,
        this.layer,
        this.type
      );
    }
  }

  ngOnInit(): void {}
}
