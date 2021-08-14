import {DomSanitizer} from '@angular/platform-browser';
import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';

import * as extent from 'ol/extent';
import Feature from 'ol/Feature';
import {GeoJSON, WKT} from 'ol/format';
import {Geometry} from 'ol/geom';
import {Select} from 'ol/interaction';
import {Vector as VectorSource} from 'ol/source';
import {click} from 'ol/events/condition';
import {toLonLat} from 'ol/proj';

import {HsConfig} from '../../config.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {HsMapService} from '../map/map.service';
import {HsMeasureService} from '../measure/measure.service';
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
    public HsQueryBaseService: HsQueryBaseService,
    public HsMapService: HsMapService,
    public HsConfig: HsConfig,
    public HsLayerUtilsService: HsLayerUtilsService,
    public HsMeasureService: HsMeasureService,
    public HsUtilsService: HsUtilsService,
    public HsEventBusService: HsEventBusService,
    private DomSanitizer: DomSanitizer
  ) {
    this.selector = new Select({
      condition: click,
      multi: this.HsConfig.query?.multi ? this.HsConfig.query.multi : false,
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
    this.HsQueryBaseService.vectorSelectorCreated.next(this.selector);

    this.HsEventBusService.olMapLoads.subscribe((map) => {
      map.addInteraction(this.selector);
    });

    this.HsQueryBaseService.queryStatusChanges.subscribe(() => {
      /*if (Base.queryActive) OlMap.map.addInteraction(this.selector);
            else OlMap.map.removeInteraction(this.selector);*/
    });

    this.selector.getFeatures().on('add', (e) => {
      this.HsEventBusService.vectorQueryFeatureSelection.next({
        feature: e.element,
        selector: this.selector,
      });
    });

    this.selector.getFeatures().on('remove', (e) => {
      this.HsEventBusService.vectorQueryFeatureDeselection.next({
        feature: e.element,
        selector: this.selector,
      });
    });
    this.HsEventBusService.vectorQueryFeatureSelection.subscribe((e) => {
      if (e?.feature) {
        const layer = this.HsMapService.getLayerForFeature(e.feature);
        if (layer && getOnFeatureSelected(layer)) {
          const originalFeature = this.getSelectedFeature(e.feature);
          if (originalFeature) {
            getOnFeatureSelected(layer)(originalFeature);
          }
        }
      }
    });
    this.HsQueryBaseService.getFeatureInfoStarted.subscribe((e) => {
      this.HsQueryBaseService.clearData('features');
      if (!this.HsQueryBaseService.queryActive) {
        return;
      }
      this.createFeatureAttributeList();
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
    this.HsQueryBaseService.data.attributes.length = 0;
    const features = this.selector.getFeatures().getArray();
    let featureDescriptions = [];
    for (const feature of features) {
      featureDescriptions = featureDescriptions.concat(
        this.getFeatureAttributes(feature)
      );
    }
    this.HsQueryBaseService.setData(featureDescriptions, 'features');
    this.HsQueryBaseService.getFeatureInfoCollected.next();
  }

  exportData(clickedFormat: 'WKT' | 'GeoJSON', feature: Feature): string {
    let fmt;
    switch (clickedFormat) {
      case 'WKT':
        fmt = new WKT();
        return fmt.writeFeature(feature);
        break;
      case 'GeoJSON':
      default:
        fmt = new GeoJSON();
        return fmt.writeFeatures([feature], {
          dataProjection: 'EPSG:4326',
          featureProjection: this.HsMapService.getCurrentProj(),
        });
        break;
    }
  }

  /**
   * @param feature
   */
  getFeatureLayerName(feature) {
    const layer = this.HsMapService.getLayerForFeature(feature);
    return this.HsLayerUtilsService.getLayerName(layer);
  }

  /**
   * @param feature
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
   * @param f Selected feature from map
   */
  addDefaultStats(f) {
    const geom = f.getGeometry();
    const type = geom.getType();
    if (type == 'Polygon') {
      const area = this.HsMeasureService.formatArea(geom);
      return [
        {name: `${area.type} in ${area.unit}`, value: area.size},
        {name: 'center', value: toLonLat(this.getCentroid(f))},
      ];
    }
    if (type == 'LineString') {
      const length = this.HsMeasureService.formatLength(geom);
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
   * @param {ol/Feature} feature
   * @returns {ol/source/Source}
   */
  olSource(feature) {
    const layer = this.HsMapService.getLayerForFeature(feature);
    if (layer == undefined) {
      return;
    } else if (layer.getSource().getSource) {
      return layer.getSource().getSource();
    } else {
      return layer.getSource();
    }
  }

  /**
   * @param {ol/Feature} feature
   * @returns {boolean}
   */
  isFeatureRemovable(feature) {
    const source = this.olSource(feature);
    if (source == undefined) {
      return false;
    }
    const layer = this.HsMapService.getLayerForFeature(feature);
    return (
      this.HsUtilsService.instOf(source, VectorSource) &&
      this.HsLayerUtilsService.isLayerEditable(layer)
    );
  }

  /**
   * @param {ol/Feature} feature
   */
  removeFeature(feature) {
    const source = this.olSource(feature);
    if (this.HsUtilsService.instOf(source, VectorSource)) {
      source.removeFeature(feature);
    }
    this.selector.getFeatures().remove(feature);
    this.featureRemovals.next(feature);
  }

  /**
   * (PRIVATE) Handler for querying vector layers of map. Get information about selected feature.
   * @param feature Selected feature from map
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
    const layer = this.HsMapService.getLayerForFeature(feature);
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
          this.DomSanitizer.bypassSecurityTrustHtml(customInfoTemplate),
      };
      tmp.push(featureDescription);
    }
    return tmp;
  }

  sanitizeAttributeValue(value) {
    if ((typeof value).toLowerCase() == 'string') {
      return this.DomSanitizer.bypassSecurityTrustHtml(value);
    } else {
      return;
    }
  }
}
