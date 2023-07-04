import {Injectable} from '@angular/core';

import BaseLayer from 'ol/layer/Base';
import Feature from 'ol/Feature';
import {Geometry} from 'ol/geom';
import {Layer} from 'ol/layer';
import {ObjectEvent} from 'ol/Object';
import {Source} from 'ol/source';
import {Vector as VectorSource} from 'ol/source';
import {buffer, getCenter} from 'ol/extent';

import {DOMFeatureLink} from '../../common/dom-feature-link.type';
import {
  DOM_FEATURE_LINKS,
  getDomFeatureLinks,
} from '../../common/layer-extensions';
import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsMapService} from '../map/map.service';
import {HsQueryBaseService} from '../query/query-base.service';
import {HsQueryPopupService} from '../query/query-popup.service';
import {HsQueryVectorService} from '../query/query-vector.service';
import {HsUtilsService} from '../utils/utils.service';

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
    private hsQueryPopupService: HsQueryPopupService,
    private hsQueryBaseService: HsQueryBaseService,
    private hsQueryVectorService: HsQueryVectorService,
    private hsLayoutService: HsLayoutService
  ) {
    this.hsMapService.loaded().then((map) => {
      for (const layer of map.getLayers().getArray()) {
        this.layerAdded(layer as Layer<Source>);
      }
      map.getLayers().on('add', (e) => this.layerAdded(e.element));
      map.getLayers().on('remove', (e) => this.layerRemoved(e.element));
    });
  }

  layerRemoved(layer: BaseLayer): void {
    if (this.hsLayerUtilsService.isLayerVectorLayer(layer)) {
      for (const key of Object.keys(this.featureLinks)) {
        const link = this.featureLinks[key];
        if (link.layer == layer) {
          this.removeFeatureLink(link);
          delete this.featureLinks[key];
        }
      }
    }
  }

  layerAdded(layer: BaseLayer): void {
    if (this.hsLayerUtilsService.isLayerVectorLayer(layer)) {
      if (getDomFeatureLinks(layer)) {
        this.processLinks(layer as Layer);
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
      if (!event.features) {
        return;
      }
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
      | 'select'
      | ((feature: Feature<Geometry>, domElement: Element, event: any) => any),
    feature: any,
    domElement: Element,
    e: Event
  ) {
    if (!this.hsMapService.getLayerForFeature(feature)?.getVisible()) {
      return;
    }
    const geom = feature.getGeometry();
    // do not zoom strictly to the extent, but a bit bigger area - needed especially for points
    const extent = buffer(geom.getExtent(), 100);
    const center = getCenter(extent);
    const map = this.hsMapService.getMap();
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
      case 'select':
        const select = this.hsQueryBaseService.selector;
        select.getFeatures().clear();
        this.hsQueryBaseService.clear('features');
        select.getFeatures().push(feature);
        this.hsQueryVectorService.createFeatureAttributeList();
        this.hsLayoutService.setMainPanel('info');
        this.hsLayoutService.sidebarExpanded = true;
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
    if (typeof link.feature == 'string' || typeof link.feature == 'number') {
      return source.getFeatureById(link.feature);
    } else if (this.hsUtilsService.instOf(link.feature, Feature)) {
      return link.feature as Feature<Geometry>;
    } else if (typeof link.feature == 'function') {
      return link.feature(layer, domElement);
    }
  }
}
