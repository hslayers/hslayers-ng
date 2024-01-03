import {Injectable} from '@angular/core';

import {BehaviorSubject, Subject} from 'rxjs';
import {Layer} from 'ol/layer';
import {Source} from 'ol/source';

import {HsCommonEndpointsService} from 'hslayers-ng/shared/endpoints';
import {HsCommonLaymanService} from 'hslayers-ng/common/layman';
import {HsConfig} from 'hslayers-ng/config';
import {HsMapService} from 'hslayers-ng/components/map';
import {HsUtilsService} from 'hslayers-ng/shared/utils';
import {getBase} from 'hslayers-ng/common/extensions';

export type DatasetType = 'url' | 'catalogue' | 'file' | 'OWS';

@Injectable({
  providedIn: 'root',
})
export class HsAddDataService {
  sidebarLoad: Subject<void> = new Subject();
  datasetSelected: BehaviorSubject<DatasetType> = new BehaviorSubject(
    undefined,
  );
  datasetTypeSelected = this.datasetSelected.asObservable();
  /**
   * Cancels any external URL data request from datasources panel
   */
  cancelUrlRequest: Subject<void> = new Subject();
  constructor(
    public hsMapService: HsMapService,
    public hsUtilsService: HsUtilsService,
    public hsConfig: HsConfig,
    public hsCommonEndpointsService: HsCommonEndpointsService,
    public hsCommonLaymanService: HsCommonLaymanService,
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
      this.hsMapService.getMap().getLayers().insertAt(ix, layer);
    } else {
      this.hsMapService.getMap().addLayer(layer);
    }
  }

  selectType(type: DatasetType): void {
    this.datasetSelected.next(type);
  }
}
