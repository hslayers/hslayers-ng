import BaseLayer from 'ol/layer/Base';
import {BaseLayerPicker} from 'cesium';
import {HsMapService} from '../map/map.service';
import {HsUtilsService} from '../utils/utils.service';
import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class HsAddLayersService {
  constructor(
    public hsMapService: HsMapService,
    public hsUtilsService: HsUtilsService
  ) {}

  addLayer(layer: BaseLayerPicker, addBefore?: BaseLayer) {
    if (addBefore) {
      const layers = this.hsMapService.map.getLayers();
      const ix = layers.getArray().indexOf(addBefore);
      layers.insertAt(ix, layer);
    } else {
      this.hsMapService.map.addLayer(layer);
    }
  }
}
