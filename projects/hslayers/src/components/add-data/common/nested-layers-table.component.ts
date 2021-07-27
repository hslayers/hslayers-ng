import {Component, EventEmitter, Input, Output} from '@angular/core';
import {HsAddDataUrlWmsService} from '../url/wms/add-data-url-wms.service'

@Component({
  selector: 'hs-nested-layers-table',
  templateUrl: './nested-layers-table.directive.html',
})
export class HsNestedLayersTableComponent {
  @Input() layers;
  @Output() layerChecked = new EventEmitter<string>(); //output

  constructor(public hsAddDataUrlWmsService: HsAddDataUrlWmsService) {}

  checked(layer): void {
    this.layerChecked.emit(layer);
  }
}
