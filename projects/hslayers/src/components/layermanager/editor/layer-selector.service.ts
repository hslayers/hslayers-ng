import {HsLayerDescriptor} from '../layer-descriptor.interface';
import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';

class HsLayerSelectorParams {
  currentLayer: HsLayerDescriptor;
}

@Injectable({
  providedIn: 'root',
})
export class HsLayerSelectorService {
  apps: {
    [id: string]: HsLayerSelectorParams;
  } = {default: new HsLayerSelectorParams()};

  layerSelected: Subject<{layer: HsLayerDescriptor; app: string}> =
    new Subject();

  constructor() {}

  /**
   * Multicasts new HsLayerManagerService.currentLayer to observers listening to the layerSelected subject.
   * @param hsLayer - Selected layer (HsLayerManagerService.currentLayer)
   */
  select(hsLayer: HsLayerDescriptor, app: string): void {
    this.get(app).currentLayer = hsLayer;
    this.layerSelected.next({layer: hsLayer, app});
  }

  get(app: string) {
    if (this.apps[app ?? 'default'] == undefined) {
      this.apps[app ?? 'default'] = new HsLayerSelectorParams();
    }
    return this.apps[app ?? 'default'];
  }
}
