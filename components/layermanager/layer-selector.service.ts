
import {Injectable} from '@angular/core';
import {HsLayerDescriptor } from './layer-descriptor.interface';
import {Subject} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class HsLayerSelectorService {
  layerSelected: Subject<any> = new Subject();
  constructor() {}

  select(layer: HsLayerDescriptor) {
    this.layerSelected.next({layer});
  }
}
