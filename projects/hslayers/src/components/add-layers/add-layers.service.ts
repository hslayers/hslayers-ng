import BaseLayer from 'ol/layer/Base';
import {HsConfig} from './../../config.service';
import {HsMapService} from '../map/map.service';
import {HsUtilsService} from '../utils/utils.service';
import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class HsAddLayersService {
  constructor(
    public hsMapService: HsMapService,
    public hsUtilsService: HsUtilsService,
    public HsConfig: HsConfig
  ) {}

  addLayer(layer: BaseLayer, addBefore?: BaseLayer) {
    if (addBefore) {
      let prevLayerZIndex: number;
      const layers = this.hsMapService.map.getLayers();
      if (this.HsConfig.reverseLayerList) {
        layer.setZIndex(addBefore.getZIndex() + 1);
      } else {
        layer.setZIndex(addBefore.getZIndex());
      }
      layers.forEach((mapLayer) => {
        if (layer.get('base') != true) {
          if (
            mapLayer.getZIndex() == layer.getZIndex() ||
            mapLayer.getZIndex() == prevLayerZIndex
          ) {
            mapLayer.setZIndex(mapLayer.getZIndex() + 1);
            prevLayerZIndex = mapLayer.getZIndex();
          }
        }
      });

      const ix = layers.getArray().indexOf(addBefore);
      layers.insertAt(ix, layer);
    } else {
      this.hsMapService.map.addLayer(layer);
    }
  }
}
