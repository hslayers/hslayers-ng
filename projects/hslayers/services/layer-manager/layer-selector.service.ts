import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';

import {HsLayerDescriptor} from 'hslayers-ng/types';

@Injectable({
  providedIn: 'root',
})
export class HsLayerSelectorService {
  currentLayer: HsLayerDescriptor;

  layerSelected: Subject<HsLayerDescriptor> = new Subject();

  constructor() {}

  /**
   * Multi-casts new HsLayerManagerService.currentLayer to observers listening to the layerSelected subject.
   * @param hsLayer - Selected layer (HsLayerManagerService.currentLayer)
   */
  select(hsLayer: HsLayerDescriptor) {
    this.currentLayer = hsLayer;
    this.layerSelected.next(hsLayer);
  }
}
