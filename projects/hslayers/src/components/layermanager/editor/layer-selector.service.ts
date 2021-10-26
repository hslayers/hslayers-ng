import {HsLayerDescriptor} from '../layer-descriptor.interface';
import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class HsLayerSelectorService {
  layerSelected: Subject<HsLayerDescriptor> = new Subject();
  currentLayer: HsLayerDescriptor;
  constructor() {}

  /**
   * Multicasts new HsLayerManagerService.currentLayer to observers listening to the layerSelected subject.
   * @param hsLayer - Selected layer (HsLayerManagerService.currentLayer)
   */
  select(hsLayer: HsLayerDescriptor): void {
    this.currentLayer = hsLayer;
    this.layerSelected.next(hsLayer);
  }
}
