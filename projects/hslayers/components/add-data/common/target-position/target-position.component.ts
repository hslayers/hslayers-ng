import {Component, EventEmitter, Input, Output, inject} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {TranslatePipe} from '@ngx-translate/core';

import Layer from 'ol/layer/Layer';
import Source from 'ol/source/Source';

import {FilterPipe} from 'hslayers-ng/common/pipes';
import {HsLayerDescriptor} from 'hslayers-ng/types';
import {HsLayerManagerService} from 'hslayers-ng/services/layer-manager';

@Component({
  selector: 'hs-target-position',
  templateUrl: './target-position.component.html',
  imports: [FormsModule, TranslatePipe, FilterPipe],
})
export class HsPositionComponent {
  hsLayerManagerService = inject(HsLayerManagerService);

  @Input() addUnder: Layer<Source> | null;
  @Output() addUnderChange = new EventEmitter<Layer<Source> | null>();

  updateChanges(): void {
    this.addUnderChange.next(this.addUnder);
  }

  /**
   * Filter layers by showInLayermanager property
   * This function is passed as filter pipe function
   */
  layerInManager = (layer: HsLayerDescriptor): boolean => {
    return layer.showInLayerManager;
  };
}
