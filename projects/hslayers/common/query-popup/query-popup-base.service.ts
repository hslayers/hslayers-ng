import {Injectable, NgZone} from '@angular/core';
import {ReplaySubject} from 'rxjs';

import {Feature} from 'ol';
import {Geometry} from 'ol/geom';

import {HsFeatureLayer} from './query-popup.service.model';
import {HsMapService} from 'hslayers-ng/services/map';
import {HsPanelItem} from 'hslayers-ng/common/panels';
import {HsQueryPopupData} from './popup-data';
import {HsQueryPopupWidgetContainerService} from './query-popup-widget-container.service';
import {HsUtilsService} from 'hslayers-ng/services/utils';
import {getName, getPopUp, getTitle} from 'hslayers-ng/common/extensions';

@Injectable({
  providedIn: 'root',
})
export class HsQueryPopupBaseService extends HsQueryPopupData {
  constructor(
    public hsMapService: HsMapService,
    public hsUtilsService: HsUtilsService,
    public zone: NgZone,
    public hsQueryPopupWidgetContainerService: HsQueryPopupWidgetContainerService,
  ) {
    super();
  }

  /**
   * Fill features for the popup
   * @param features - Features found on the map under the mouse
   */
  fillFeatures(features: Feature<Geometry>[]): void {
    //Zone is needed for performance reasons. Otherwise the popups don't get hidden soon enough
    this.zone.run(() => {
      this.featuresUnderMouse = features;
      if (this.featuresUnderMouse.length) {
        const featuresByLayer = features.reduce(
          (acc, feature) => {
            const layer = this.hsMapService.getLayerForFeature(feature);
            if (layer === undefined) {
              return acc;
            }
            const popUp = getPopUp(layer);
            if (popUp) {
              const layerName = getName(layer);
              if (!acc[layerName]) {
                const needSpecialWidgets =
                  popUp.widgets || popUp.displayFunction;
                acc[layerName] = {
                  layer: layer,
                  title: getTitle(layer),
                  features: [],
                  panelObserver: needSpecialWidgets
                    ? new ReplaySubject<HsPanelItem>()
                    : undefined,
                };
              }
              acc[layerName].features.push(feature);
            }
            return acc;
          },
          {} as {[key: string]: HsFeatureLayer},
        );

        this.featureLayersUnderMouse = Object.values(featuresByLayer);

        for (const layer of this.featureLayersUnderMouse) {
          if (layer.panelObserver) {
            const popupDef = getPopUp(layer.layer);
            let widgets = popupDef?.widgets;
            if (popupDef?.displayFunction) {
              widgets = ['dynamic-text'];
            }
            this.hsQueryPopupWidgetContainerService.initWidgets(
              widgets,
              layer.panelObserver,
            );
          }
        }
      } else {
        this.featuresUnderMouse = [];
        this.featureLayersUnderMouse = [];
      }
    });
  }

  /**
   * Close the popup
   */
  closePopup(): void {
    this.featuresUnderMouse = [];
    this.featureLayersUnderMouse = [];
  }

  /**
   * Get feature attributes in an array, where each attribute is represented as \{key, value, displayFunction\}.
   * @param feature - Feature selected
   * @returns Serialized attributes
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
    if (attrsConfig.length == 1 && attrsConfig[0] == '*') {
      attrsConfig = Object.keys(feature.getProperties()).filter(
        (attr) => attr != 'geometry',
      );
      attrsConfig.sort((a, b) => (a < b ? -1 : 1));
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
