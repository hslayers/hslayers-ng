import {Injectable, NgZone} from '@angular/core';

import {Feature, Map} from 'ol';
import {Geometry} from 'ol/geom';

import {HsMapService} from '../map/map.service';
import {HsUtilsService} from '../utils/utils.service';
import {getPopUp, getTitle} from '../../common/layer-extensions';

@Injectable({
  providedIn: 'root',
})
export class HsQueryPopupBaseService {
  map: Map;
  featuresUnderMouse: Feature<Geometry>[] = [];
  featureLayersUnderMouse = [];
  hoverPopup: any;

  constructor(
    public hsMapService: HsMapService,
    public hsUtilsService: HsUtilsService,
    public zone: NgZone
  ) {}

  fillFeatures(features: Feature<Geometry>[]) {
    this.zone.run(() => {
      this.featuresUnderMouse = features;
      if (this.featuresUnderMouse.length) {
        const layersFound = this.hsUtilsService.removeDuplicates(
          this.featuresUnderMouse.map((f) =>
            this.hsMapService.getLayerForFeature(f)
          ),
          'title'
        );
        this.featureLayersUnderMouse = layersFound.map((l) => {
          const layer = {
            title: getTitle(l),
            layer: l,
            features: this.featuresUnderMouse.filter(
              (f) => this.hsMapService.getLayerForFeature(f) == l
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

  /**
   * @param feature -
   */
  serializeFeatureAttributes(feature: Feature<Geometry>): any[] {
    const attributesForHover = [];
    const layer = this.hsMapService.getLayerForFeature(feature);
    if (layer === undefined) {
      return;
    }
    let attrsConfig = [];
    if (getPopUp(layer)?.attributes) {
      //must be an array
      attrsConfig = getPopUp(layer).attributes;
    } else {
      // Layer is not configured to show pop-ups
      return;
    }
    for (const attr of attrsConfig) {
      let attrName, attrLabel;
      let attrFunction = (x) => x;
      if (typeof attr === 'string' || attr instanceof String) {
        //simple case when only attribute name is provided in the layer config
        attrName = attr;
        attrLabel = attr;
      } else {
        if (attr.attribute == undefined) {
          //implies malformed layer config - 'attribute' is obligatory in this case
          continue;
        }
        attrName = attr.attribute;
        attrLabel = attr.label != undefined ? attr.label : attr.attribute;
        if (attr.displayFunction) {
          attrFunction = attr.displayFunction;
        }
      }
      if (feature.get(attrName)) {
        attributesForHover.push({
          key: attrLabel,
          value: feature.get(attrName),
          displayFunction: attrFunction,
        });
      }
    }
    return attributesForHover;
  }
}
