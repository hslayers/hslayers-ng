import {DomSanitizer} from '@angular/platform-browser';
import {Injectable} from '@angular/core';

import * as extent from 'ol/extent';
import Feature from 'ol/Feature';
import {GeoJSON, WKT} from 'ol/format';
import {Geometry} from 'ol/geom';
import {Map} from 'ol';
import {Select} from 'ol/interaction';
import {Subject} from 'rxjs';
import {Vector as VectorSource} from 'ol/source';
import {click} from 'ol/events/condition';
import {toLonLat} from 'ol/proj';

import {HsConfig} from '../../config.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {HsMapService} from '../map/map.service';
import {HsQueryBaseService} from './query-base.service';
import {HsUtilsService} from '../utils/utils.service';

import {
  getCustomInfoTemplate,
  getOnFeatureSelected,
  getQueryable,
  getVirtualAttributes,
} from '../../common/layer-extensions';
import {getFeatures} from '../../common/feature-extensions';

type AttributeValuePair = {
  name;
  value;
  sanitizedValue?;
};

@Injectable({
  providedIn: 'root',
})
export class HsQueryVectorService {
  selector: Select;
  featureRemovals: Subject<Feature<Geometry>> = new Subject();

  constructor(
    public hsQueryBaseService: HsQueryBaseService,
    public hsMapService: HsMapService,
    public hsConfig: HsConfig,
    public hsLayerUtilsService: HsLayerUtilsService,
    public hsUtilsService: HsUtilsService,
    public hsEventBusService: HsEventBusService,
    private domSanitizer: DomSanitizer
  ) {
    this.selector = new Select({
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
    });
    this.hsQueryBaseService.vectorSelectorCreated.next(this.selector);

    this.hsEventBusService.olMapLoads.subscribe((map) => {
      map.addInteraction(this.selector);
    });

    this.hsQueryBaseService.queryStatusChanges.subscribe(() => {
      /*if (Base.queryActive) OlMap.map.addInteraction(this.selector);
            else OlMap.map.removeInteraction(this.selector);*/
    });

    this.selector.getFeatures().on('add', (e) => {
      this.hsEventBusService.vectorQueryFeatureSelection.next({
        feature: e.element,
        selector: this.selector,
      });
    });

    this.selector.getFeatures().on('remove', (e) => {
      this.hsEventBusService.vectorQueryFeatureDeselection.next({
        feature: e.element,
        selector: this.selector,
      });
    });
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
    this.hsQueryBaseService.getFeatureInfoStarted.subscribe((e) => {
      this.hsQueryBaseService.clearData('features');
      if (!this.hsQueryBaseService.queryActive) {
        return;
      }
      this.createFeatureAttributeList();
    });
  }
  getFeaturesUnderMouse(map: Map, pixel: any) {
    return map
      .getFeaturesAtPixel(pixel)
      .filter((feature: Feature<Geometry>) => {
        const layer = this.hsMapService.getLayerForFeature(feature);
        return layer && layer != this.hsQueryBaseService.queryLayer;
      });
  }
  getSelectedFeature(feature: any): any {
    let original = feature;
    if (getFeatures(original) && getFeatures(original).length == 1) {
      original = getFeatures(original)[0];
    }
    return original;
  }
  createFeatureAttributeList() {
    this.hsQueryBaseService.data.attributes.length = 0;
    const features = this.selector.getFeatures().getArray();
    let featureDescriptions = [];
    for (const feature of features) {
      featureDescriptions = featureDescriptions.concat(
        this.getFeatureAttributes(feature)
      );
    }
    this.hsQueryBaseService.setData(featureDescriptions, 'features');
    this.hsQueryBaseService.getFeatureInfoCollected.next();
  }

  exportData(
    clickedFormat: 'WKT' | 'GeoJSON',
    feature: Feature<Geometry>[] | Feature<Geometry>
  ): string {
    let fmt;
    const featureArray = Array.isArray(feature) ? feature : [feature];
    switch (clickedFormat) {
      case 'WKT':
        fmt = new WKT();
        return fmt.writeFeatures(featureArray);
        break;
      case 'GeoJSON':
      default:
        fmt = new GeoJSON();
        return fmt.writeFeatures(featureArray, {
          dataProjection: 'EPSG:4326',
          featureProjection: this.hsMapService.getCurrentProj(),
        });
        break;
    }
  }

  /**
   * @param feature -
   */
  getFeatureLayerName(feature) {
    const layer = this.hsMapService.getLayerForFeature(feature);
    return this.hsLayerUtilsService.getLayerName(layer);
  }

  /**
   * @param feature - Selected feature from map
   */
  getCentroid(feature) {
    if (feature == undefined) {
      return;
    }
    const center = extent.getCenter(feature.getGeometry().getExtent());
    return center;
  }
  /**
   * (PRIVATE) Adding a default stats to query based on feature geom type
   * @param f - Selected feature from map
   */
  addDefaultStats(f) {
    const geom = f.getGeometry();
    const type = geom.getType();
    if (type == 'Polygon') {
      const area = this.hsUtilsService.formatArea(
        geom,
        this.hsMapService.getCurrentProj()
      );
      return [
        {name: `${area.type} in ${area.unit}`, value: area.size},
        {name: 'center', value: toLonLat(this.getCentroid(f))},
      ];
    }
    if (type == 'LineString') {
      const length = this.hsUtilsService.formatLength(
        geom,
        this.hsMapService.getCurrentProj()
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
   * @param feature - Selected feature from map
   * @returns
   */
  olSource(feature) {
    const layer = this.hsMapService.getLayerForFeature(feature);
    if (layer == undefined) {
      return;
    } else if (layer.getSource().getSource) {
      return layer.getSource().getSource();
    } else {
      return layer.getSource();
    }
  }

  /**
   * @param feature - Selected feature from map
   * @returns
   */
  isFeatureRemovable(feature) {
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
   * @param feature - Selected feature from map
   */
  removeFeature(feature) {
    const source = this.olSource(feature);
    if (this.hsUtilsService.instOf(source, VectorSource)) {
      source.removeFeature(feature);
    }
    this.selector.getFeatures().remove(feature);
    this.featureRemovals.next(feature);
  }

  /**
   * (PRIVATE) Handler for querying vector layers of map. Get information about selected feature.
   * @param feature - Selected feature from map
   */
  getFeatureAttributes(feature) {
    const attributes = [];
    let tmp = [];
    const hstemplate = feature.get('hstemplate')
      ? feature.get('hstemplate')
      : null;
    let customInfoTemplate = null;
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
    if (layer && getCustomInfoTemplate(layer)) {
      customInfoTemplate = getCustomInfoTemplate(layer);
    }
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
      const featureDescription = {
        layer: this.getFeatureLayerName(feature),
        name: 'Feature',
        attributes: attributes,
        stats: this.addDefaultStats(feature),
        hstemplate,
        feature,
        customInfoTemplate:
          this.domSanitizer.bypassSecurityTrustHtml(customInfoTemplate),
      };
      tmp.push(featureDescription);
    }
    return tmp;
  }

  sanitizeAttributeValue(value) {
    if ((typeof value).toLowerCase() == 'string') {
      return this.domSanitizer.bypassSecurityTrustHtml(value);
    } else {
      return;
    }
  }
}
