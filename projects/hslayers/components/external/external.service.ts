import {Injectable} from '@angular/core';

import BaseLayer from 'ol/layer/Base';
import {Cluster, Source, Vector as VectorSource} from 'ol/source';
import {Feature} from 'ol';
import {Geometry} from 'ol/geom';
import {Layer, Vector as VectorLayer} from 'ol/layer';
import {ObjectEvent} from 'ol/Object';
import {buffer, getCenter} from 'ol/extent';

import {DOMFeatureLink} from 'hslayers-ng/common/types';
import {
  DOM_FEATURE_LINKS,
  getDomFeatureLinks,
} from 'hslayers-ng/common/extensions';
import {HsLayerUtilsService} from 'hslayers-ng/shared/utils';
import {HsLayoutService} from 'hslayers-ng/shared/layout';
import {HsLogService} from 'hslayers-ng/shared/log';
import {HsMapService} from 'hslayers-ng/shared/map';
import {HsQueryBaseService} from '../query/query-base.service';
import {HsQueryPopupService} from '../query/query-popup.service';
import {HsQueryVectorService} from '../query/query-vector.service';
import {HsUtilsService} from 'hslayers-ng/shared/utils';

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
    private hsLog: HsLogService,
    private hsQueryPopupService: HsQueryPopupService,
    private hsQueryBaseService: HsQueryBaseService,
    private hsQueryVectorService: HsQueryVectorService,
    private hsLayoutService: HsLayoutService,
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

  /**
   * Registers DOM--feature links for newly added layer and
   * also sets listener for 'propertychange' in case the domFeatureLinks are changed later on.
   * The linked feature cannot be a RenderFeature.
   * @param layer - OL BaseLayer (superclass of Layer)
   */
  layerAdded(layer: BaseLayer): void {
    if (!this.hsLayerUtilsService.isLayerVectorLayer(layer)) {
      return;
    }
    if (getDomFeatureLinks(layer)) {
      this.processLinks(layer as VectorLayer<VectorSource>);
    }
    (layer as VectorLayer<VectorSource>).on('propertychange', (e) => {
      this.hsUtilsService.debounce(this.layerPropChanged(e), 100, false, this);
    });
  }

  layerPropChanged(e: ObjectEvent): void {
    if (e.key == DOM_FEATURE_LINKS) {
      this.processLinks(e.target);
    }
  }

  private processLinks(layer: VectorLayer<VectorSource>) {
    const source: VectorSource = this.hsLayerUtilsService.isLayerClustered(
      layer,
    )
      ? (layer.getSource() as Cluster).getSource()
      : layer.getSource();
    for (const link of getDomFeatureLinks(layer)) {
      const domElements = document.querySelectorAll(link.domSelector);
      domElements.forEach((domElement) => {
        const feature = this.getFeature(layer, source, link, domElement);
        if (!feature) {
          this.hsLog.error(
            `Cannot bind event ${link.event} from ${domElement} to feature ${link.feature}. Feature not found!`,
          );
          return;
        }
        if (feature.getId() === undefined) {
          feature.setId(this.hsUtilsService.generateUuid());
        }
        //We don't want to add handlers with the same feature and domElement twice
        if (
          feature &&
          (!this.featureLinks[feature.getId()] ||
            !this.featureLinks[feature.getId()].domElements.includes(
              domElement,
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
    feature: Feature,
    domElement: Element,
    e: Event,
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
        this.hsLayoutService.setMainPanel('query');
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
    source: VectorSource,
    link: DOMFeatureLink,
    domElement: Element,
  ): Feature<Geometry> {
    if (typeof link.feature == 'string' || typeof link.feature == 'number') {
      const featureLike = source.getFeatureById(link.feature);
      //Filter out possible RenderFeatures
      return featureLike instanceof Feature ? featureLike : undefined;
    } else if (this.hsUtilsService.instOf(link.feature, Feature)) {
      return link.feature as Feature<Geometry>;
    } else if (typeof link.feature == 'function') {
      return link.feature(layer, domElement);
    }
  }
}
