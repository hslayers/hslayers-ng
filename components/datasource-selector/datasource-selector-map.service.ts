import VectorLayer from 'ol/layer/Vector';
import {Fill, Stroke, Style} from 'ol/style';
import {Vector} from 'ol/source';
import {transform} from 'ol/proj';

/* eslint-disable angular/on-watch */
/**
 * @param $timeout
 * @param HsMapService
 * @param $log
 */
export default function ($timeout, HsMapService, $log) {
  'ngInject';
  const me = this;

  /**
   * @param evt
   */
  function mapPointerMoved(evt) {
    const features = me.extentLayer
      .getSource()
      .getFeaturesAtCoordinate(evt.coordinate);
    let somethingChanged = false;
    angular.forEach(me.extentLayer.getSource().getFeatures(), (feature) => {
      if (feature.get('record').highlighted) {
        feature.get('record').highlighted = false;
        somethingChanged = true;
      }
    });
    if (features.length) {
      angular.forEach(features, (feature) => {
        if (!feature.get('record').highlighted) {
          feature.get('record').highlighted = true;
          somethingChanged = true;
        }
      });
    }
    if (somethingChanged) {
      $timeout(() => {}, 0);
    }
  }

  /**
   * @param map
   */
  function init(map) {
    map.on('pointermove', mapPointerMoved);
    map.addLayer(me.extentLayer);
  }

  angular.extend(me, {
    extentLayer: new VectorLayer({
      title: 'Datasources extents',
      show_in_manager: false,
      source: new Vector(),
      style: function (feature, resolution) {
        return [
          new Style({
            stroke: new Stroke({
              color: '#005CB6',
              width: feature.get('highlighted') ? 4 : 1,
            }),
            fill: new Fill({
              color: 'rgba(0, 0, 255, 0.01)',
            }),
          }),
        ];
      },
    }),

    clearExtentLayer() {
      me.extentLayer.getSource().clear();
    },

    /**
     * @function clearDatasetFeatures
     * @memberOf HsDatasourceBrowserService
     * @param {object} dataset Configuration of selected datasource (from app config)
     * Remove layer extent features from map
     */
    clearDatasetFeatures(dataset) {
      angular.forEach(dataset.layers, (val) => {
        try {
          if (angular.isDefined(val.feature) && val.feature) {
            me.extentLayer.getSource().removeFeature(val.feature);
          }
        } catch (ex) {
          $log.warn(ex);
        }
      });
    },

    /**
     * @function isZoomable
     * @memberOf HsDataSourceSelectorMapService
     * @param {unknown} layer TODO
     * @returns {boolean} Returns if bbox is specified and thus layer is zoomable
     * Test if it possible to zoom to layer overview (bbox has to be defined
     * in metadata of selected layer)
     */
    isZoomable(layer) {
      return angular.isDefined(layer.bbox);
    },

    /**
     * @function addExtentFeature
     * @memberOf HsDataSourceSelectorMapService
     * @param {ol/Feature} extentFeature Openlayers Feature
     * @description  Callback function which gets executed when extent feature
     * is created. It should add the feature to vector layer source
     */
    addExtentFeature(extentFeature) {
      me.extentLayer.getSource().addFeatures([extentFeature]);
    },

    highlightComposition(composition, state) {
      if (angular.isDefined(composition.feature)) {
        composition.feature.set('highlighted', state);
      }
    },

    /**
     * @function zoomTo
     * @memberOf HsDataSourceSelectorMapService
     * @param {string} bbox Bounding box of selected layer
     * ZoomTo / MoveTo to selected layer overview
     */
    zoomTo(bbox) {
      if (angular.isUndefined(bbox)) {
        return;
      }
      let b = null;
      if (angular.isString(bbox)) {
        b = bbox.split(' ');
      } else if (angular.isArray(bbox)) {
        b = bbox;
      }
      let first_pair = [parseFloat(b[0]), parseFloat(b[1])];
      let second_pair = [parseFloat(b[2]), parseFloat(b[3])];
      first_pair = transform(
        first_pair,
        'EPSG:4326',
        HsMapService.map.getView().getProjection()
      );
      second_pair = transform(
        second_pair,
        'EPSG:4326',
        HsMapService.map.getView().getProjection()
      );
      if (
        isNaN(first_pair[0]) ||
        isNaN(first_pair[1]) ||
        isNaN(second_pair[0]) ||
        isNaN(second_pair[1])
      ) {
        return;
      }
      const extent = [
        first_pair[0],
        first_pair[1],
        second_pair[0],
        second_pair[1],
      ];
      HsMapService.map.getView().fit(extent, HsMapService.map.getSize());
    },
  });

  HsMapService.loaded().then(init);
  return me;
}
