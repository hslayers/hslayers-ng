import {Injectable, NgZone} from '@angular/core';
import {ReplaySubject} from 'rxjs';

import {Feature, Map} from 'ol';
import {Geometry} from 'ol/geom';

import {HsClearLayerComponent} from './widgets/clear-layer.component';
import {HsConfig} from '../../config.service';
import {HsFeatureInfoComponent} from './widgets/feature-info.component';
import {HsFeatureLayer} from './query-popup.service.model';
import {HsLayerNameComponent} from './widgets/layer-name.component';
import {HsMapService} from '../map/map.service';
import {HsPanelItem} from '../layout/panels/panel-item';
import {HsQueryPopupWidgetContainerService} from './query-popup-widget-container.service';
import {HsUtilsService} from '../utils/utils.service';
import {WidgetItem} from './widgets/widget-item.type';
import {getPopUp, getTitle} from '../../common/layer-extensions';

@Injectable({
  providedIn: 'root',
})
export class HsQueryPopupBaseService {
  map: Map;
  featuresUnderMouse: Feature<Geometry>[] = [];
  featureLayersUnderMouse: HsFeatureLayer[] = [];
  hoverPopup: any;
  queryPopupWidgets: WidgetItem[] = [
    {name: 'layer-name', component: HsLayerNameComponent},
    {name: 'feature-info', component: HsFeatureInfoComponent},
    {name: 'clear-layer', component: HsClearLayerComponent},
  ];

  constructor(
    public hsMapService: HsMapService,
    public hsUtilsService: HsUtilsService,
    public zone: NgZone,
    public hsConfig: HsConfig,
    public hsQueryPopupWidgetContainerService: HsQueryPopupWidgetContainerService
  ) {
    this.initWidgets(this.hsConfig.queryPopupWidgets);
  }

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
          const layer = {
            title: getTitle(l),
            layer: l,
            features: this.featuresUnderMouse.filter(
              (f) => this.hsMapService.getLayerForFeature(f) == l
            ),
            panelObserver: getPopUp(l)?.widgets
              ? new ReplaySubject<HsPanelItem>()
              : undefined,
          };
          return layer;
        });
        for (const layer of this.featureLayersUnderMouse) {
          if (layer.panelObserver) {
            this.initWidgets(
              getPopUp(layer.layer)?.widgets,
              layer.panelObserver
            );
          }
        }
      } else {
        this.featuresUnderMouse = [];
      }
    });
  }

  initWidgets(
    widgetNames: string[],
    panelObserver?: ReplaySubject<HsPanelItem>
  ) {
    if (widgetNames?.length > 0) {
      for (const widgetName of widgetNames) {
        let widgetFound = this.queryPopupWidgets.find(
          (widget) => widget.name == widgetName
        );

        if (!widgetFound && this.hsConfig.customQueryPopupWidgets?.length > 0) {
          widgetFound = this.hsConfig.customQueryPopupWidgets.find(
            (widget) => widget.name == widgetName
          );
        }
        this.hsQueryPopupWidgetContainerService.create(
          widgetFound.component,
          undefined,
          panelObserver
        );
      }
    }
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
