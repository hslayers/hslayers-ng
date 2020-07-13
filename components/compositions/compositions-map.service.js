import VectorLayer from 'ol/layer/Vector';
import {Fill, Stroke, Style} from 'ol/style';
import {Vector} from 'ol/source';

/* eslint-disable angular/on-watch */
/**
 * @param $timeout
 * @param HsEventBusService
 * @param HsMapService
 * @param HsLayoutService
 */
export default function (
  $timeout,
  HsEventBusService,
  HsMapService,
  HsLayoutService
) {
  'ngInject';
  const me = this;

  /**
   * @param evt
   */
  function mapPointerMoved(evt) {
    const features = me.extentLayer
      .getSource()
      .getFeaturesAtCoordinate(evt.coordinate);
    let somethingDone = false;
    angular.forEach(me.extentLayer.getSource().getFeatures(), (feature) => {
      if (feature.get('record').highlighted) {
        feature.get('record').highlighted = false;
        somethingDone = true;
      }
    });
    if (features.length) {
      angular.forEach(features, (feature) => {
        if (!feature.get('record').highlighted) {
          feature.get('record').highlighted = true;
          somethingDone = true;
        }
      });
    }
    if (somethingDone) {
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

  HsMapService.loaded().then(init);

  HsEventBusService.mainPanelChanges.subscribe(() => {
    if (angular.isDefined(me.extentLayer)) {
      if (
        HsLayoutService.mainpanel === 'composition_browser' ||
        HsLayoutService.mainpanel === 'composition'
      ) {
        me.extentLayer.setVisible(true);
      } else {
        me.extentLayer.setVisible(false);
      }
    }
  });

  return angular.extend(me, {
    extentLayer: new VectorLayer({
      title: 'Composition extents',
      show_in_manager: false,
      source: new Vector(),
      removable: false,
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

    highlightComposition(composition, state) {
      if (angular.isDefined(composition.feature)) {
        composition.feature.set('highlighted', state);
      }
    },

    clearExtentLayer() {
      me.extentLayer.getSource().clear();
    },

    getFeatureRecordAndUnhighlight(feature, selector) {
      if (
        angular.isDefined(feature.get('is_hs_composition_extent')) &&
        angular.isDefined(feature.get('record'))
      ) {
        const record = feature.get('record');
        feature.set('highlighted', false);
        selector.getFeatures().clear();
        return record;
      }
    },
  });
}
