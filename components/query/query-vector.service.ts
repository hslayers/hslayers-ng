import * as extent from 'ol/extent';
import Feature from 'ol/Feature';
import {HsConfig} from '../../config.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {HsMapService} from '../map/map.service';
import {HsMeasureService} from '../measure/measure.service';
import {HsQueryBaseService} from './query-base.service';
import {HsUtilsService} from '../utils/utils.service';
import {Injectable} from '@angular/core';
import {Select} from 'ol/interaction';
import {Subject} from 'rxjs';
import {Vector as VectorSource} from 'ol/source';
import {WKT} from 'ol/format';
import {click} from 'ol/events/condition';
import {toLonLat} from 'ol/proj';

@Injectable({
  providedIn: 'root',
})
export class HsQueryVectorService {
  exportedFeatureHref: any;
  selector: any;
  featureRemovals: Subject<Feature> = new Subject();

  constructor(
    private HsQueryBaseService: HsQueryBaseService,
    private HsMapService: HsMapService,
    private HsConfig: HsConfig,
    private HsLayerUtilsService: HsLayerUtilsService,
    private HsMeasureService: HsMeasureService,
    private HsUtilsService: HsUtilsService,
    private HsEventBusService: HsEventBusService
  ) {
    this.selector = new Select({
      condition: click,
      multi: this.HsConfig.query?.multi ? this.HsConfig.query.multi : false,
      filter: function (feature, layer) {
        if (layer === null) {
          return;
        }
        if (layer.get('queryable') === false) {
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
      this.HsEventBusService.vectorQueryFeatureDeselection.next(e.element);
    });

    this.HsQueryBaseService.getFeatureInfoStarted.subscribe((e) => {
      this.HsQueryBaseService.clearData('features');
      if (!this.HsQueryBaseService.queryActive) {
        return;
      }
      this.createFeatureAttributeList();
    });
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

  exportData(clickedFormat, feature) {
    if (clickedFormat == 'WKT format') {
      const formatWKT = new WKT();
      const wktRepresentation = formatWKT.writeFeature(feature);
      const data = new Blob([wktRepresentation], {type: 'text/plain'});
      const url = URL.createObjectURL(data);
      if (this.exportedFeatureHref) {
        URL.revokeObjectURL(this.exportedFeatureHref);
      }
      this.exportedFeatureHref = url;
    } else {
      return;
    }
  }

  /**
   * @param feature
   */
  getFeatureLayerName(feature) {
    if (feature.getLayer == undefined) {
      return '';
    }
    const layer = feature.getLayer(HsMapService.map);
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
   *
   * @function addDefaultAttributes
   * @param f
   * @memberOf HsQueryController
   * @param feature Selected feature from map
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
    const layer = feature.getLayer(HsMapService.map);
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
    const layer = feature.getLayer(HsMapService.map);
    return (
      this.HsUtilsService.instOf(source, VectorSource) &&
      this.HsLayerUtilsService.isLayerEditable(layer)
    );
  }

  /**
   * @param {ol/layer/Layer} layer
   * @returns {boolean}
   */
  isLayerEditable(layer) {
    return this.HsLayerUtilsService.isLayerEditable(layer);
  }

  /**
   * @param {ol/Feature} feature
   */
  removeFeature(feature) {
    const source = this.olSource(feature);
    if (this.HsUtilsService.instOf(source, VectorSource)) {
      source.removeFeature(feature);
    }
    this.featureRemovals.next(feature);
  }

  /**
   * (PRIVATE) Handler for querying vector layers of map. Get information about selected feature.
   *
   * @function getFeatureAttributes
   * @memberOf HsQueryController
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
        for (const subFeature of feature.get('features')) {
          tmp = tmp.concat(this.getFeatureAttributes(subFeature));
        }
      } else {
        let obj;
        if ((typeof feature.get(key)).toLowerCase() == 'string') {
          obj = {
            name: key,
            value: $sce.trustAsHtml(feature.get(key)),
          };
        } else {
          obj = {
            name: key,
            value: feature.get(key),
          };
        }
        attributes.push(obj);
      }
    });
    if (
      feature.getLayer &&
      feature.getLayer(HsMapService.map).get('customInfoTemplate')
    ) {
      customInfoTemplate = feature
        .getLayer(HsMapService.map)
        .get('customInfoTemplate');
    }

    const featureDescription = {
      layer: this.getFeatureLayerName(feature),
      name: 'Feature',
      attributes: attributes,
      stats: this.addDefaultStats(feature),
      hstemplate,
      feature,
      customInfoTemplate: $sce.trustAsHtml(customInfoTemplate),
    };
    tmp.push(featureDescription);
    return tmp;
  }
}
