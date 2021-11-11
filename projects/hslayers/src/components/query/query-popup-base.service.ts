import {Injectable, NgZone} from '@angular/core';
import {ReplaySubject} from 'rxjs';

import {Feature, Map} from 'ol';
import {Geometry} from 'ol/geom';

import {HsConfig} from '../../config.service';
import {HsFeatureLayer} from './query-popup.service.model';
import {HsMapService} from '../map/map.service';
import {HsPanelItem} from '../layout/panels/panel-item';
import {HsQueryPopupWidgetContainerService} from './query-popup-widget-container.service';
import {HsUtilsService} from '../utils/utils.service';
import {getPopUp, getTitle} from '../../common/layer-extensions';

@Injectable({
  providedIn: 'root',
})
export class HsQueryPopupBaseService {
  map: Map;
  featuresUnderMouse: Feature<Geometry>[] = [];
  featureLayersUnderMouse: HsFeatureLayer[] = [];
  hoverPopup: any;

  constructor(
    public hsMapService: HsMapService,
    public hsUtilsService: HsUtilsService,
    public zone: NgZone,
    public hsConfig: HsConfig,
    public hsQueryPopupWidgetContainerService: HsQueryPopupWidgetContainerService
  ) {}

  fillFeatures(features: Feature<Geometry>[]) {
    //Zone is needed for performance reasons. Otherwise the popups dont get hidden soon enough
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
          const needSpecialWidgets =
            getPopUp(l)?.widgets || getPopUp(l)?.displayFunction;
          const layer = {
            title: getTitle(l),
            layer: l,
            features: this.featuresUnderMouse.filter(
              (f) => this.hsMapService.getLayerForFeature(f) == l
            ),
            panelObserver: needSpecialWidgets
              ? new ReplaySubject<HsPanelItem>()
              : undefined,
          };
          return layer;
        });
        for (const layer of this.featureLayersUnderMouse) {
          if (layer.panelObserver) {
            const popupDef = getPopUp(layer.layer);
            let widgets = popupDef?.widgets;
            if (popupDef?.displayFunction) {
              widgets = ['dynamic-text'];
            }
            this.hsQueryPopupWidgetContainerService.initWidgets(
              widgets,
              layer.panelObserver
            );
          }
        }
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
