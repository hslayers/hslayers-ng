import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import {Injectable} from '@angular/core';

import * as extent from 'ol/extent';
import {Cluster, Vector as VectorSource} from 'ol/source';
// eslint-disable-next-line import/named
import {Coordinate} from 'ol/coordinate';
import {Feature, Map} from 'ol';
// eslint-disable-next-line import/named
import {FeatureLike} from 'ol/Feature';
import {GeoJSON, WKT} from 'ol/format';
import {Geometry, LineString, Polygon} from 'ol/geom';
import {Select} from 'ol/interaction';
import {Subject} from 'rxjs';
import {click} from 'ol/events/condition';
import {toLonLat} from 'ol/proj';

import {HsConfig} from 'hslayers-ng/config';
import {HsEventBusService} from 'hslayers-ng/services/event-bus';
import {HsLayerUtilsService} from 'hslayers-ng/services/utils';
import {HsMapService} from 'hslayers-ng/services/map';
import {HsQueryBaseService} from './query-base.service';
import {HsUtilsService} from 'hslayers-ng/services/utils';
import {StyleLike, createDefaultStyle} from 'ol/style/Style';
import {getFeatures} from 'hslayers-ng/common/extensions';
import {
  getOnFeatureSelected,
  getQueryable,
  getVirtualAttributes,
} from 'hslayers-ng/common/extensions';

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
  selector: Select = null;
  constructor(
    private hsQueryBaseService: HsQueryBaseService,
    private hsMapService: HsMapService,
    private hsConfig: HsConfig,
    private hsLayerUtilsService: HsLayerUtilsService,
    private hsUtilsService: HsUtilsService,
    private hsEventBusService: HsEventBusService,
    private domSanitizer: DomSanitizer,
  ) {
    this.hsQueryBaseService.getFeatureInfoStarted.subscribe((evt) => {
      this.hsQueryBaseService.clear('features');
      if (!this.hsQueryBaseService.queryActive) {
        return;
      }
      this.createFeatureAttributeList();
    });
    this.setNewSelector();
    this.hsEventBusService.vectorQueryFeatureSelection.subscribe((e) => {
      if (e?.feature) {
        const layer = this.hsMapService.getLayerForFeature(e.feature);
        if (layer && getOnFeatureSelected(layer)) {
          const originalFeature = this.getSelectedFeature(e.feature);
          if (originalFeature) {
            getOnFeatureSelected(layer)(originalFeature);
          }
        }
      }
    });
  }

  /**
   * Set new selector for the app
   */
  setNewSelector(style?: StyleLike | null): void {
    const selector = new Select({
      condition: click,
      multi: this.hsConfig.query?.multi ? this.hsConfig.query.multi : false,
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
      style: style === undefined ? createDefaultStyle : style,
    });
    this.selector = selector;
    this.hsQueryBaseService.vectorSelectorCreated.next(selector);

    this.hsEventBusService.olMapLoads.subscribe((map) => {
      map.addInteraction(selector);
    });

    selector.getFeatures().on('add', (e) => {
      this.hsEventBusService.vectorQueryFeatureSelection.next({
        feature: e.element,
        selector,
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
   * @returns Array with features
   */
  getFeaturesUnderMouse(map: Map, pixel: number[]): FeatureLike[] {
    return map
      .getFeaturesAtPixel(pixel)
      .filter((feature: Feature<Geometry>) => {
        const layer = this.hsMapService.getLayerForFeature(feature);
        return layer && layer != this.hsQueryBaseService.queryLayer;
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
   */
  createFeatureAttributeList(): void {
    this.hsQueryBaseService.attributes.length = 0;
    const features = this.selector.getFeatures().getArray();
    let featureDescriptions = [];
    for (const feature of features) {
      featureDescriptions = featureDescriptions.concat(
        this.getFeatureAttributes(feature),
      );
    }
    this.hsQueryBaseService.set(featureDescriptions, 'features');
    this.hsQueryBaseService.getFeatureInfoCollected.next();
  }

  /**
   * Export feature/s in specified format
   * @param clickedFormat - Export format
   * @param feature - Feature or features to export
   * @returns Formatted features
   */
  exportData(
    clickedFormat: 'WKT' | 'GeoJSON',
    feature: Feature<Geometry>[] | Feature<Geometry>,
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
          featureProjection: this.hsMapService.getCurrentProj(),
        });
    }
  }

  /**
   * Get layer name from the feature selected
   * @param feature - Feature selected
   * @returns Layer name
   */
  getFeatureLayerName(feature: Feature<Geometry>): string {
    const layer = this.hsMapService.getLayerForFeature(feature);
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
   * @returns Default feature stats
   */
  private addDefaultStats(f: Feature<Geometry>): {name: string; value: any}[] {
    const geom = f.getGeometry();
    const type = geom.getType();
    if (type == 'Polygon') {
      const area = this.hsUtilsService.formatArea(
        geom as Polygon,
        this.hsMapService.getCurrentProj(),
      );
      return [
        {name: `${area.type} in ${area.unit}`, value: area.size},
        {name: 'center', value: toLonLat(this.getCentroid(f))},
      ];
    }
    if (type == 'LineString') {
      const length = this.hsUtilsService.formatLength(
        geom as LineString,
        this.hsMapService.getCurrentProj(),
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
   * @returns Vector layer's source
   */
  olSource(feature: Feature<Geometry>): VectorSource {
    const layer = this.hsMapService.getLayerForFeature(feature);
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
   * @returns True if feature is removable, false otherwise
   */
  isFeatureRemovable(feature: Feature<Geometry>): boolean {
    const source = this.olSource(feature);
    if (source == undefined) {
      return false;
    }
    const layer = this.hsMapService.getLayerForFeature(feature);
    return (
      this.hsUtilsService.instOf(source, VectorSource) &&
      this.hsLayerUtilsService.isLayerEditable(layer)
    );
  }

  /**
   * Remove selected feature
   * @param feature - Selected feature from map
   */
  removeFeature(feature: Feature<Geometry>): void {
    const source = this.olSource(feature);
    if (this.hsUtilsService.instOf(source, VectorSource)) {
      source.removeFeature(feature);
    }
    this.selector.getFeatures().remove(feature);
    this.featureRemovals.next(feature);
  }

  /**
   * Handler for querying vector layers of map. Get information about selected feature.
   * @param feature - Selected feature from map
   * @returns Feature attributes
   */
  getFeatureAttributes(feature: Feature<Geometry>): FeatureDescription[] {
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
          tmp = tmp.concat(this.getFeatureAttributes(subFeature));
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
    const layer = this.hsMapService.getLayerForFeature(feature);
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
        layer: this.getFeatureLayerName(feature),
        name: 'Feature',
        attributes: attributes,
        stats: this.addDefaultStats(feature),
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
