import {Component, EventEmitter, Input, Output} from '@angular/core';
import {FormsModule} from '@angular/forms';

import {HsUrlWmsService} from 'hslayers-ng/services/add-data';
import {TrackByPropertyPipe} from 'hslayers-ng/common/pipes';
import {TranslateCustomPipe} from 'hslayers-ng/services/language';
import {WmsLayerHighlightDirective} from '../wms-layer-highlight.directive';

@Component({
  selector: 'hs-nested-layers-table',
  templateUrl: './nested-layers-table.component.html',
  standalone: true,
  imports: [
    FormsModule,
    TranslateCustomPipe,
    TrackByPropertyPipe,
    WmsLayerHighlightDirective,
  ],
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
