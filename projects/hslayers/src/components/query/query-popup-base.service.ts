import {Injectable, NgZone} from '@angular/core';

import {Feature, Map} from 'ol';
import {Geometry} from 'ol/geom';

import {HsMapService} from '../map/map.service';
import {HsUtilsService} from '../utils/utils.service';
import {getTitle} from '../../common/layer-extensions';

@Injectable({
  providedIn: 'root',
})
export class HsQueryPopupBaseService {
  map: Map;
  featuresUnderMouse: Feature<Geometry>[] = [];
  featureLayersUnderMouse = [];
  hoverPopup: any;

  constructor(
    public HsMapService: HsMapService,
    public HsUtilsService: HsUtilsService,
    public zone: NgZone
  ) {}

  fillFeatures(features: Feature<Geometry>[]) {
    this.zone.run(() => {
      this.featuresUnderMouse = features;
      if (this.featuresUnderMouse.length) {
        const layersFound = this.HsUtilsService.removeDuplicates(
          this.featuresUnderMouse.map((f) =>
            this.HsMapService.getLayerForFeature(f)
          ),
          'title'
        );
        this.featureLayersUnderMouse = layersFound.map((l) => {
          const layer = {
            title: getTitle(l),
            layer: l,
            features: this.featuresUnderMouse.filter(
              (f) => this.HsMapService.getLayerForFeature(f) == l
            ),
          };
          return layer;
        });
      } else {
        this.featuresUnderMouse = [];
      }
    });
  }

  closePopup(): void {
    this.featuresUnderMouse = [];
  }
}
