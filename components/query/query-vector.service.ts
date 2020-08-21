import * as extent from 'ol/extent';
import {HsConfig} from '../../config.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {HsMapService} from '../map/map.service';
import {HsMeasureService} from '../measure/measure.service';
import {HsQueryBaseService} from './query-base.service';
import {HsUtilsService} from '../utils/utils.service';
import {Injectable} from '@angular/core';
import {Select} from 'ol/interaction';
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
      multi:
        angular.isDefined(this.HsConfig.query) && this.HsConfig.query.multi
          ? this.HsConfig.query.multi
          : false,
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
    $rootScope.$broadcast('vectorSelectorCreated', this.selector);

    HsEventBusService.olMapLoads.subscribe((map) => {
      map.addInteraction(this.selector);
    });

    $rootScope.$on('queryStatusChanged', () => {
      /*if (Base.queryActive) OlMap.map.addInteraction(this.selector);
            else OlMap.map.removeInteraction(this.selector);*/
    });

    this.selector.getFeatures().on('add', (e) => {
      HsEventBusService.vectorQueryFeatureSelection.next({
        feature: e.element,
        selector: this.selector,
      });
      //deprecated
      $rootScope.$broadcast(
        'infopanel.feature_selected',
        e.element,
        this.selector
      );
    });

    this.selector.getFeatures().on('remove', (e) => {
      $rootScope.$broadcast('vectorQuery.featureDelected', e.element);
      //deprecated
      $rootScope.$broadcast('infopanel.feature_deselected', e.element);
    });

    $rootScope.$on('mapQueryStarted', (e) => {
      HsQueryBaseService.clearData('features');
      if (!HsQueryBaseService.queryActive) {
        return;
      }
      this.createFeatureAttributeList();
    });
  }

  createFeatureAttributeList() {
    this.HsQueryBaseService.data.attributes.length = 0;
    const features = this.selector.getFeatures().getArray();
    let featureDescriptions = [];
    angular.forEach(features, (feature) => {
      featureDescriptions = featureDescriptions.concat(
        this.getFeatureAttributes(feature)
      );
    });
    this.HsQueryBaseService.setData(featureDescriptions, 'features');
    $rootScope.$broadcast('queryVectorResult');
  }

  exportData(clickedFormat, feature) {
    if (clickedFormat == 'WKT format') {
      const formatWKT = new WKT();
      const wktRepresentation = formatWKT.writeFeature(feature);
      const data = new Blob([wktRepresentation], {type: 'text/plain'});
      const url = $window.URL.createObjectURL(data);
      if (this.exportedFeatureHref) {
        $window.URL.revokeObjectURL(this.exportedFeatureHref);
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
    if (angular.isUndefined(feature.getLayer)) {
      return '';
    }
    const layer = feature.getLayer(HsMapService.map);
    return this.HsLayerUtilsService.getLayerName(layer);
  }

  /**
   * @param feature
   */
  getCentroid(feature) {
    if (angular.isUndefined(feature)) {
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
    if (angular.isUndefined(layer)) {
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
    if (angular.isUndefined(source)) {
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
