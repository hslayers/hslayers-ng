import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';

import {Layer} from 'ol/layer';
import {Source} from 'ol/source';

import {AddDataUrlType} from './url/types/add-data-url.type';
import {HsConfig} from '../../config.service';
import {HsMapService} from '../map/map.service';
import {HsUtilsService} from '../utils/utils.service';
import {getBase} from '../../common/layer-extensions';

export type DatasetType = 'url' | 'catalogue' | 'file' | 'OWS';

@Injectable({
  providedIn: 'root',
})
export class HsAddDataService {
  typeSelected: DatasetType;
  //Holds reference to data.url.component type selected
  urlType: AddDataUrlType;
  datasetSelected: Subject<{type: DatasetType}> = new Subject();
  /**
   * Cancels any external url data request from datasources panel
   */
  cancelUrlRequest: Subject<void> = new Subject<void>();
  constructor(
    public hsMapService: HsMapService,
    public hsUtilsService: HsUtilsService,
    public hsConfig: HsConfig
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
    this.typeSelected = type;
    this.datasetSelected.next({type: type});
  }
}
