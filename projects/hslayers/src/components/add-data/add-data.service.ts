import {Injectable} from '@angular/core';

import {Layer} from 'ol/layer';
import {Source} from 'ol/source';
import {Subject} from 'rxjs';

import {HsCommonEndpointsService} from '../../common/endpoints/endpoints.service';
import {HsCommonLaymanService} from '../../common/layman/layman.service';
import {HsConfig} from '../../config.service';
import {HsMapService} from '../map/map.service';
import {HsUtilsService} from '../utils/utils.service';
import {getBase} from '../../common/layer-extensions';

export type DatasetType = 'url' | 'catalogue' | 'file' | 'OWS';

@Injectable({
  providedIn: 'root',
})
export class HsAddDataService {
  dsSelected: DatasetType;
  datasetSelected: Subject<{type: DatasetType}> = new Subject();
  /**
   * Cancels any external url data request from datasources panel
   */
  cancelUrlRequest: Subject<void> = new Subject<void>();
  constructor(
    public hsMapService: HsMapService,
    public hsUtilsService: HsUtilsService,
    public hsConfig: HsConfig,
    public hsCommonEndpointsService: HsCommonEndpointsService,
    public hsCommonLaymanService: HsCommonLaymanService
  ) {}

  addLayer(layer: Layer<Source>, underLayer?: Layer<Source>): void {
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

  selectType(type: DatasetType): void {
    this.dsSelected = type;
    this.datasetSelected.next({type: type});
  }
}
