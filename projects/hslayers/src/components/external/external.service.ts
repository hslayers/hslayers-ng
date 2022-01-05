import {Injectable} from '@angular/core';

import Feature from 'ol/Feature';
import VectorSource from 'ol/source/Vector';
import {Geometry} from 'ol/geom';
import {Layer} from 'ol/layer';
import {Map} from 'ol';
import {ObjectEvent} from 'ol/Object';
import {Source} from 'ol/source';

import {DOMFeatureLink} from '../../common/dom-feature-link.type';
import {
  DOM_FEATURE_LINKS,
  getDomFeatureLinks,
} from '../../common/layer-extensions';
import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {HsMapService} from '../map/map.service';
import {HsQueryPopupService} from '../query/query-popup.service';
import {HsUtilsService} from '../utils/utils.service';
import {getCenter} from 'ol/extent';

export type FeatureDomEventLink = {
  handles: EventListenerOrEventListenerObject[];
  layer: Layer<Source>;
  domElements: Element[];
  event: string;
};

export interface FeatureDomEventLinkDict {
  [key: string]: FeatureDomEventLink;
}

@Injectable({
  providedIn: 'root',
})
export class HsExternalService {
  featureLinks: FeatureDomEventLinkDict = {};
  constructor(
    public hsMapService: HsMapService,
    public hsUtilsService: HsUtilsService,
    private hsLayerUtilsService: HsLayerUtilsService,
    private hsQueryPopupService: HsQueryPopupService
  ) {
    this.hsMapService.loaded().then((map) => this.init(map));
  }

  init(map: Map) {
    for (const layer of map.getLayers().getArray()) {
      this.layerAdded(layer as Layer<Source>);
    }
    map.getLayers().on('add', (e) => this.layerAdded(e.element));
    map.getLayers().on('remove', (e) => this.layerRemoved(e.element));
  }

  layerRemoved(layer: Layer<Source>): void {
    if (this.hsLayerUtilsService.isLayerVectorLayer(layer)) {
      for (const key of Object.keys(this.featureLinks)) {
        const link = this.featureLinks[key];
        this.removeFeatureLink(link);
        delete this.featureLinks[key];
      }
    }
  }

  layerAdded(layer: Layer<Source>): void {
    if (this.hsLayerUtilsService.isLayerVectorLayer(layer)) {
      if (getDomFeatureLinks(layer)) {
        this.processLinks(layer);
      }
      layer.on('propertychange', (e) => {
        this.hsUtilsService.debounce(
          this.layerPropChanged(e),
          100,
          false,
          this
        );
      });
    }
  }
  layerPropChanged(e: ObjectEvent): void {
    if (e.key == DOM_FEATURE_LINKS) {
      this.processLinks(e.target as Layer<Source>);
    }
  }

  private processLinks(layer: Layer<any>) {
    const source: VectorSource<Geometry> =
      this.hsLayerUtilsService.isLayerClustered(layer)
        ? layer.getSource().getSource()
        : layer.getSource();
    for (const link of getDomFeatureLinks(layer)) {
      const domElements = document.querySelectorAll(link.domSelector);
      domElements.forEach((domElement) => {
        const feature = this.getFeature(layer, source, link, domElement);
        if (feature.getId() === undefined) {
          feature.setId(this.hsUtilsService.generateUuid());
        }
        //We dont want to add handlers with the same feature and domElement twice
        if (
          feature &&
          (!this.featureLinks[feature.getId()] ||
            !this.featureLinks[feature.getId()].domElements.includes(
              domElement
            ))
        ) {
          const featureId = feature.getId();
          //This was the only way how to unregister handlers afterwards
          const handler = (e) => {
            for (const action of link.actions) {
              this.actOnFeature(action, feature, domElement, e);
            }
          };
          if (!this.featureLinks[featureId]) {
            this.featureLinks[featureId] = {
              handles: [],
              layer,
              domElements: [],
              event: link.event,
            };
          }
          this.featureLinks[featureId].handles.push(handler);
          this.featureLinks[featureId].domElements.push(domElement);
          domElement.addEventListener(link.event, handler);
        }
      });
    }
    source.on('removefeature', (event) => {
      for (const removedFeature of event.features) {
        const linkage = this.featureLinks[removedFeature.getId()];
        if (linkage) {
          this.removeFeatureLink(linkage);
          delete this.featureLinks[removedFeature.getId()];
        }
      }
    });
  }

  private removeFeatureLink(linkage: FeatureDomEventLink) {
    for (const handle of linkage.handles) {
      for (const domEl of linkage.domElements) {
        domEl.removeEventListener(linkage.event, handle);
      }
    }
  }

  actOnFeature(
    action:
      | 'zoomToExtent'
      | 'panToCenter'
      | 'showPopup'
      | 'hidePopup'
      | ((feature: Feature<Geometry>, domElement: Element, event: any) => any),
    feature: any,
    domElement: Element,
    e: Event
  ) {
    const extent = feature.getGeometry().getExtent();
    const center = getCenter(extent);
    const map = this.hsMapService.map;
    switch (action) {
      case 'zoomToExtent':
        this.hsMapService.fitExtent(extent);
        break;
      case 'panToCenter':
        map.getView().setCenter(center);
        break;
      case 'showPopup':
        this.hsQueryPopupService.fillFeatures([feature]);
        const pixel = map.getPixelFromCoordinate(center);
        this.hsQueryPopupService.showPopup({pixel, map});
        break;
      case 'hidePopup':
        this.hsQueryPopupService.closePopup();
        break;
      default:
        if (typeof action == 'function') {
          action(feature, domElement, e);
        }
    }
  }

  private getFeature(
    layer: Layer<Source>,
    source: VectorSource<Geometry>,
    link: DOMFeatureLink,
    domElement: Element
  ): Feature<Geometry> {
    if (typeof link.feature == 'string') {
      return source
        .getFeatures()
        .find((feature) => feature.get('id'), link.feature);
    } else if (this.hsUtilsService.instOf(link.feature, Feature)) {
      return link.feature as Feature<Geometry>;
    } else if (typeof link.feature == 'function') {
      return link.feature(layer, domElement);
    }
  }
}
