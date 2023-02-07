import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import {Injectable} from '@angular/core';

import * as extent from 'ol/extent';
import Feature, {FeatureLike} from 'ol/Feature';
import {Cluster, Vector as VectorSource} from 'ol/source';
import {Coordinate} from 'ol/coordinate';
import {GeoJSON, WKT} from 'ol/format';
import {Geometry, LineString, Polygon} from 'ol/geom';
import {Map} from 'ol';
import {Select} from 'ol/interaction';
import {Subject} from 'rxjs';
import {click} from 'ol/events/condition';
import {toLonLat} from 'ol/proj';

import {HsConfig} from '../../config.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {HsMapService} from '../map/map.service';
import {HsQueryBaseService} from './query-base.service';
import {HsUtilsService} from '../utils/utils.service';
import {getFeatures} from '../../common/feature-extensions';
import {
  getOnFeatureSelected,
  getQueryable,
  getVirtualAttributes,
} from '../../common/layer-extensions';

type AttributeValuePair = {
  name;
  value;
  sanitizedValue?;
};

type FeatureDescription = {
  layer: string;
  name: string;
  attributes: any[];
  stats: {
    name: string;
    value: any;
  }[];
  hstemplate: any;
  feature: any;
};

@Injectable({
  providedIn: 'root',
})
export class HsQueryVectorService {
  featureRemovals: Subject<Feature<Geometry>> = new Subject();
  apps: {[key: string]: {selector: Select}} = {};

  constructor(
    private hsQueryBaseService: HsQueryBaseService,
    private hsMapService: HsMapService,
    private hsConfig: HsConfig,
    private hsLayerUtilsService: HsLayerUtilsService,
    private hsUtilsService: HsUtilsService,
    private hsEventBusService: HsEventBusService,
    private domSanitizer: DomSanitizer
  ) {}

  /**
   * Get the params saved by the query vector service for the current app
   * @param app - App identifier
   * @returns Query vector service data for the app
   */
  get(app: string = 'default'): {selector: Select} {
    if (this.apps[app] == undefined) {
      this.apps[app] = {selector: null};
    }
    return this.apps[app];
  }
  /**
   * Initialize the query vector service data and subscribers
   * @param _app - App identifier
   */
  init(_app: string): void {
    const queryBaseAppRef = this.hsQueryBaseService.get(_app);
    this.hsQueryBaseService.getFeatureInfoStarted.subscribe(({evt, app}) => {
      if (_app == app) {
        queryBaseAppRef.clear('features');
        if (!queryBaseAppRef.queryActive) {
          return;
        }
        this.createFeatureAttributeList(app);
      }
    });
    if (this.apps[_app]) {
      return;
    } else {
      this.setNewSelector(_app);
      this.hsEventBusService.vectorQueryFeatureSelection.subscribe((e) => {
        if (e?.feature && e.app == _app) {
          const layer = this.hsMapService.getLayerForFeature(e.feature, _app);
          if (layer && getOnFeatureSelected(layer)) {
            const originalFeature = this.getSelectedFeature(e.feature);
            if (originalFeature) {
              getOnFeatureSelected(layer)(originalFeature);
            }
          }
        }
      });
    }
  }

  /**
   * Set new selector for the app
   * @param _app - App identifier
   */
  setNewSelector(_app: string): void {
    const selector = new Select({
      condition: click,
      multi: this.hsConfig.get(_app).query?.multi
        ? this.hsConfig.get(_app).query.multi
        : false,
      filter: function (feature, layer) {
        if (layer === null) {
          return;
        }
        if (getQueryable(layer) === false) {
          return false;
        } else {
          return true;
        }
      },
    });
    this.get(_app).selector = selector;
    this.hsQueryBaseService.vectorSelectorCreated.next({selector, app: _app});

    this.hsEventBusService.olMapLoads.subscribe(({map, app}) => {
      if (_app == app) {
        map.addInteraction(selector);
      }
    });

    selector.getFeatures().on('add', (e) => {
      this.hsEventBusService.vectorQueryFeatureSelection.next({
        feature: e.element,
        selector,
        app: _app,
      });
    });

    selector.getFeatures().on('remove', (e) => {
      this.hsEventBusService.vectorQueryFeatureDeselection.next({
        feature: e.element,
        selector,
      });
    });
  }

  /**
   * Get features under the mouse pointer on the map
   * @param map - Current map object
   * @param pixel - Target pixel
   * @param app - App identifier
   * @returns Array with features
   */
  getFeaturesUnderMouse(map: Map, pixel: number[], app: string): FeatureLike[] {
    return map
      .getFeaturesAtPixel(pixel)
      .filter((feature: Feature<Geometry>) => {
        const layer = this.hsMapService.getLayerForFeature(feature, app);
        return layer && layer != this.hsQueryBaseService.get(app).queryLayer;
      });
  }

  /**
   * Get selected features original data
   * @param feature - Feature selected
   * @returns Feature
   */
  getSelectedFeature(feature: Feature<Geometry>): Feature<Geometry> {
    let original = feature;
    if (getFeatures(original) && getFeatures(original).length == 1) {
      original = getFeatures(original)[0];
    }
    return original;
  }

  /**
   * Create attribute list for all of the features selected with the selector
   * @param app - App identifier
   */
  createFeatureAttributeList(app: string): void {
    const queryBaseAppRef = this.hsQueryBaseService.get(app);
    queryBaseAppRef.attributes.length = 0;
    const features = this.get(app).selector.getFeatures().getArray();
    let featureDescriptions = [];
    for (const feature of features) {
      featureDescriptions = featureDescriptions.concat(
        this.getFeatureAttributes(feature, app)
      );
    }
    queryBaseAppRef.set(featureDescriptions, 'features');
    this.hsQueryBaseService.getFeatureInfoCollected.next();
  }

  /**
   * Export feature/s in specified format
   * @param clickedFormat - Export format
   * @param feature - Feature or features to export
   * @param app - App identifier
   * @returns Formatted features
   */
  exportData(
    clickedFormat: 'WKT' | 'GeoJSON',
    feature: Feature<Geometry>[] | Feature<Geometry>,
    app: string
  ): string {
    let fmt;
    const featureArray = Array.isArray(feature) ? feature : [feature];
    switch (clickedFormat) {
      case 'WKT':
        fmt = new WKT();
        return fmt.writeFeatures(featureArray);
      case 'GeoJSON':
      default:
        fmt = new GeoJSON();
        return fmt.writeFeatures(featureArray, {
          dataProjection: 'EPSG:4326',
          featureProjection: this.hsMapService.getCurrentProj(app),
        });
    }
  }

  /**
   * Get layer name from the feature selected
   * @param feature - Feature selected
   * @param app - App identifier
   * @returns Layer name
   */
  getFeatureLayerName(feature: Feature<Geometry>, app: string): string {
    const layer = this.hsMapService.getLayerForFeature(feature, app);
    return this.hsLayerUtilsService.getLayerName(layer);
  }

  /**
   * Get center coordinates of the selected feature
   * @param feature - Selected feature from the map
   * @returns Center coordinates
   */
  getCentroid(feature: Feature<Geometry>): Coordinate {
    if (feature == undefined) {
      return;
    }
    const center = extent.getCenter(feature.getGeometry().getExtent());
    return center;
  }
  /**
   * Adding a default stats to query based on feature geometry type
   * @param f - Selected feature from the map
   * @param app - App identifier
   * @returns Default feature stats
   */
  private addDefaultStats(
    f: Feature<Geometry>,
    app: string
  ): {name: string; value: any}[] {
    const geom = f.getGeometry();
    const type = geom.getType();
    if (type == 'Polygon') {
      const area = this.hsUtilsService.formatArea(
        geom as Polygon,
        this.hsMapService.getCurrentProj(app)
      );
      return [
        {name: `${area.type} in ${area.unit}`, value: area.size},
        {name: 'center', value: toLonLat(this.getCentroid(f))},
      ];
    }
    if (type == 'LineString') {
      const length = this.hsUtilsService.formatLength(
        geom as LineString,
        this.hsMapService.getCurrentProj(app)
      );
      return [
        {name: `${length.type} in ${length.unit}`, value: length.size},
        {name: 'center', value: toLonLat(this.getCentroid(f))},
      ];
    }
    if (type == 'Point') {
      return [{name: 'center', value: toLonLat(this.getCentroid(f))}];
    }
  }

  /**
   * Find layer source from the feature selected
   * @param feature - Selected feature from the map
   * @param app - App identifier
   * @returns Vector layer's source
   */
  olSource(feature: Feature<Geometry>, app: string): VectorSource<Geometry> {
    const layer = this.hsMapService.getLayerForFeature(feature, app);
    if (layer == undefined) {
      return;
    } else if (this.hsUtilsService.instOf(layer.getSource(), Cluster)) {
      return (layer.getSource() as Cluster).getSource();
    } else {
      return layer.getSource();
    }
  }

  /**
   * Check if feature is removable
   * @param feature - Selected feature from the map
   * @param app - App identifier
   * @returns True if feature is removable, false otherwise
   */
  isFeatureRemovable(feature: Feature<Geometry>, app: string): boolean {
    const source = this.olSource(feature, app);
    if (source == undefined) {
      return false;
    }
    const layer = this.hsMapService.getLayerForFeature(feature, app);
    return (
      this.hsUtilsService.instOf(source, VectorSource) &&
      this.hsLayerUtilsService.isLayerEditable(layer)
    );
  }

  /**
   * Remove selected feature
   * @param feature - Selected feature from map
   * @param app - App identifier
   */
  removeFeature(feature: Feature<Geometry>, app: string): void {
    const source = this.olSource(feature, app);
    if (this.hsUtilsService.instOf(source, VectorSource)) {
      source.removeFeature(feature);
    }
    this.get(app).selector.getFeatures().remove(feature);
    this.featureRemovals.next(feature);
  }

  /**
   * Handler for querying vector layers of map. Get information about selected feature.
   * @param feature - Selected feature from map
   * @param app - App identifier
   * @returns Feature attributes
   */
  getFeatureAttributes(
    feature: Feature<Geometry>,
    app: string
  ): FeatureDescription[] {
    const attributes = [];
    let tmp: FeatureDescription[] = [];
    const hstemplate = feature.get('hstemplate')
      ? feature.get('hstemplate')
      : null;
    feature.getKeys().forEach((key) => {
      if (['gid', 'geometry', 'wkb_geometry'].indexOf(key) > -1) {
        return;
      }
      if (key == 'features') {
        for (const subFeature of getFeatures(feature)) {
          tmp = tmp.concat(this.getFeatureAttributes(subFeature, app));
        }
      } else {
        const obj: AttributeValuePair = {
          name: key,
          value: feature.get(key),
        };
        obj.sanitizedValue = this.sanitizeAttributeValue(feature.get(key));
        attributes.push(obj);
      }
    });
    const layer = this.hsMapService.getLayerForFeature(feature, app);
    if (layer && getVirtualAttributes(layer)) {
      const virtualAttributes = getVirtualAttributes(layer);
      for (const key of Object.keys(virtualAttributes)) {
        const value = virtualAttributes[key](feature);
        const obj: AttributeValuePair = {
          name: key,
          value,
        };
        obj.sanitizedValue = this.sanitizeAttributeValue(value);
        attributes.push(obj);
      }
    }
    if (!getFeatures(feature)) {
      const featureDescription: FeatureDescription = {
        layer: this.getFeatureLayerName(feature, app),
        name: 'Feature',
        attributes: attributes,
        stats: this.addDefaultStats(feature, app),
        hstemplate,
        feature,
      };
      tmp.push(featureDescription);
    }
    return tmp;
  }

  /**
   * Sanitize attribute value to be safe HTML if it is a string
   * @param value - Attribute value
   * @returns Sanitized attribute value
   */
  sanitizeAttributeValue(value): SafeHtml {
    if ((typeof value).toLowerCase() == 'string') {
      return this.domSanitizer.bypassSecurityTrustHtml(value);
    } else {
      return;
    }
  }
}
