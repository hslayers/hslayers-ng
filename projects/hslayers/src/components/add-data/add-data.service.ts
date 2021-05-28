import {Injectable} from '@angular/core';

import BaseLayer from 'ol/layer/Base';
import {Subject} from 'rxjs';

import {HsConfig} from '../../config.service';
import {HsMapService} from '../map/map.service';
import {HsUtilsService} from '../utils/utils.service';
import {getBase} from '../../common/layer-extensions';

@Injectable({
  providedIn: 'root',
})
export class HsAddDataService {
  typeSelected: string;
  //Holds reference to data.url.component type selected
  urlType: string;
  datasetSelected: Subject<{type: any}> = new Subject();
  /**
   * Cancels any external url data request from datasources panel
   */
  cancelUrlRequest: Subject<void> = new Subject<void>();
  constructor(
    public hsMapService: HsMapService,
    public hsUtilsService: HsUtilsService,
    public hsConfig: HsConfig
  ) {}

  addLayer(layer: BaseLayer, underLayer?: BaseLayer): void {
    if (underLayer) {
      const layers = this.hsMapService.getLayersArray();
      const underZ = underLayer.getZIndex();
      layer.setZIndex(underZ);
      for (const iLayer of layers.filter((l) => !getBase(l))) {
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
    this.datasetSelected.next({type: type});
  }
}
