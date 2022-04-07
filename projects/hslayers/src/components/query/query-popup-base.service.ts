import {Injectable, NgZone} from '@angular/core';

import {Feature} from 'ol';
import {Geometry} from 'ol/geom';
import {ReplaySubject} from 'rxjs';

import {HsMapService} from '../map/map.service';
import {HsPanelItem} from '../layout/panels/panel-item';
import {HsQueryPopupData} from './popup-data';
import {HsQueryPopupWidgetContainerService} from './query-popup-widget-container.service';
import {HsUtilsService} from '../utils/utils.service';
import {getPopUp, getTitle} from '../../common/layer-extensions';

@Injectable({
  providedIn: 'root',
})
export class HsQueryPopupBaseService {
  apps: {
    [key: string]: HsQueryPopupData;
  } = {};
  constructor(
    public hsMapService: HsMapService,
    public hsUtilsService: HsUtilsService,
    public zone: NgZone,
    public hsQueryPopupWidgetContainerService: HsQueryPopupWidgetContainerService
  ) {}

  /**
   * Set up query popup base service data for the app if needed
   * @param app - App identifier
   */
  public setAppIfNeeded(app: string): void {
    if (this.apps[app] == undefined) {
      this.apps[app] = new HsQueryPopupData();
    }
  }

  /**
   * Fill features for the popup
   * @param features - Features found on the map under the mouse
   * @param app - App identifier
   */
  fillFeatures(features: Feature<Geometry>[], app: string): void {
    //Zone is needed for performance reasons. Otherwise the popups dont get hidden soon enough
    this.zone.run(() => {
      this.apps[app].featuresUnderMouse = features;
      if (this.apps[app].featuresUnderMouse.length) {
        const layersFound = this.hsUtilsService.removeDuplicates(
          this.apps[app].featuresUnderMouse.map((f) =>
            this.hsMapService.getLayerForFeature(f, app)
          ),
          'title'
        );
        this.apps[app].featureLayersUnderMouse = layersFound
          .filter((l) => getPopUp(l)) //Only list the layers which have popUp defined
          .map((l) => {
            const needSpecialWidgets =
              getPopUp(l)?.widgets || getPopUp(l)?.displayFunction;
            const layer = {
              title: getTitle(l),
              layer: l,
              features: this.apps[app].featuresUnderMouse.filter(
                (f) => this.hsMapService.getLayerForFeature(f, app) == l
              ),
              panelObserver: needSpecialWidgets
                ? new ReplaySubject<HsPanelItem>()
                : undefined,
            };
            return layer;
          });
        for (const layer of this.apps[app].featureLayersUnderMouse) {
          if (layer.panelObserver) {
            const popupDef = getPopUp(layer.layer);
            let widgets = popupDef?.widgets;
            if (popupDef?.displayFunction) {
              widgets = ['dynamic-text'];
            }
            this.hsQueryPopupWidgetContainerService.initWidgets(
              widgets,
              app,
              layer.panelObserver
            );
          }
        }
      } else {
        this.apps[app].featuresUnderMouse = [];
      }
    });
  }

  /**
   * Close the popup
   * @param app - App identifier
   */
  closePopup(app: string): void {
    this.apps[app].featuresUnderMouse = [];
  }

  /**
   * Serialize feature attributes
   * @param feature - Feature selected
   * @param app - App identifier
   * @returns Serialized attributes
   */
  serializeFeatureAttributes(feature: Feature<Geometry>, app: string): any[] {
    const attributesForHover = [];
    const layer = this.hsMapService.getLayerForFeature(feature, app);
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
