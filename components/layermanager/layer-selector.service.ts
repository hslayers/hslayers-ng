import {HsLayerDescriptor} from './layer-descriptor.interface';
import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class HsLayerSelectorService {
  layerSelected: Subject<HsLayerDescriptor> = new Subject();
  constructor() {}

  /**
   * @function select
   * @memberOf HsLayerSelectorService
   * @description Multicasts new HsLayerManagerService.currentLayer to observers listening to the layerSelected subject.
   * @param {HsLayerDescriptor} HsLayer Selected layer (HsLayerManagerService.currentLayer)
   */
  select(HsLayer: HsLayerDescriptor) {
    this.layerSelected.next(HsLayer);
  }
}
