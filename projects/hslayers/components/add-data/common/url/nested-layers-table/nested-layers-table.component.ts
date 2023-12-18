import {Component, EventEmitter, Input, Output} from '@angular/core';

import {HsUrlWmsService} from '../../../url/wms/wms.service';

@Component({
  selector: 'hs-nested-layers-table',
  templateUrl: './nested-layers-table.component.html',
})
export class HsNestedLayersTableComponent {
  @Input() layers;

  @Output() layerChecked = new EventEmitter<string>(); //output

  constructor(public hsUrlWmsService: HsUrlWmsService) {}

  checked(layer): void {
    this.layerChecked.emit(layer);
  }

  isArray(maybeArray: any): boolean {
    return Array.isArray(maybeArray);
  }
}
