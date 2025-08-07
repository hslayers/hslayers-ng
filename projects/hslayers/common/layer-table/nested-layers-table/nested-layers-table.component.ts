import {Component, EventEmitter, Input, Output, inject} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {TranslatePipe} from '@ngx-translate/core';

import {HsUrlWmsService} from 'hslayers-ng/services/add-data';
import {WmsLayerHighlightDirective} from '../wms-layer-highlight.directive';

@Component({
  selector: 'hs-nested-layers-table',
  templateUrl: './nested-layers-table.component.html',
  imports: [FormsModule, TranslatePipe, WmsLayerHighlightDirective],
})
export class HsNestedLayersTableComponent {
  hsUrlWmsService = inject(HsUrlWmsService);

  @Input() layers;

  @Output() layerChecked = new EventEmitter<string>();

  checked(layer): void {
    this.layerChecked.emit(layer);
  }

  isArray(maybeArray: any): boolean {
    return Array.isArray(maybeArray);
  }
}
