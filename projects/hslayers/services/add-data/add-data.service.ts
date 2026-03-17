import {Injectable, inject} from '@angular/core';

import Layer from 'ol/layer/Layer';
import Source from 'ol/source/Source';
import {BehaviorSubject, Subject} from 'rxjs';

import {DatasetType} from 'hslayers-ng/types';
import {getBase} from 'hslayers-ng/common/extensions';
import {HsCommonEndpointsService} from 'hslayers-ng/services/endpoints';
import {HsCommonLaymanService} from 'hslayers-ng/common/layman';
import {HsConfig} from 'hslayers-ng/config';
import {HsMapService} from 'hslayers-ng/services/map';

@Injectable({
  providedIn: 'root',
})
export class HsAddDataService {
  hsMapService = inject(HsMapService);
  hsConfig = inject(HsConfig);
  hsCommonEndpointsService = inject(HsCommonEndpointsService);
  hsCommonLaymanService = inject(HsCommonLaymanService);

  sidebarLoad: Subject<void> = new Subject();
  datasetSelected: BehaviorSubject<DatasetType> = new BehaviorSubject(
    undefined,
  );
  datasetTypeSelected = this.datasetSelected.asObservable();

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
