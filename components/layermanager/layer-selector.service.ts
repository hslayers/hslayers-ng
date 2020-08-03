
import {Injectable} from '@angular/core';
import {Layer} from 'ol/layer';
import {Subject} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class HsLayerSelectorService {
  layerSelected: Subject<any> = new Subject();
  constructor() {}

  select(layer: Layer) {
    this.layerSelected.next({layer});
  }
}
