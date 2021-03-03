import {Component, EventEmitter, Input, Output} from '@angular/core';

@Component({
  selector: 'hs-nested-layers-table',
  templateUrl: './nested-layers-table.directive.html',
})
export class HsNestedLayersTableComponent {
  @Input() layers;
  @Output() layerChecked = new EventEmitter<string>(); //output

  constructor() {}

  checked(layer): void {
    this.layerChecked.emit(layer);
  }
}
