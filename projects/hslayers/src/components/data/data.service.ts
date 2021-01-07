import BaseLayer from 'ol/layer/Base';
import {HsConfig} from './../../config.service';
import {HsMapService} from '../map/map.service';
import {HsUtilsService} from '../utils/utils.service';
import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class HsDataService {
  typeSelected: string;
  constructor(
    public hsMapService: HsMapService,
    public hsUtilsService: HsUtilsService,
    public HsConfig: HsConfig
  ) {}

  addLayer(layer: BaseLayer, underLayer?: BaseLayer) {
    if (underLayer) {
      const layers = this.hsMapService.getLayersArray();
      const underZ = underLayer.getZIndex();
      layer.setZIndex(underZ);
      for (const iLayer of layers.filter((l) => !l.get('base'))) {
        if (iLayer.getZIndex() >= underZ) {
          iLayer.setZIndex(iLayer.getZIndex() + 1);
        }
      }
      const ix = layers.indexOf(underLayer);
      this.hsMapService.map.getLayers().insertAt(ix, layer);
    } else {
      this.hsMapService.map.addLayer(layer);
    }
  }

  selectType(type: string): void {
    this.typeSelected = type;
  }
}
