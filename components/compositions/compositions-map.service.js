import {Vector} from 'ol/source';
import VectorLayer from 'ol/layer/Vector';
import SparqlJson from 'hs.source.SparqlJson';
import {Style, Stroke, Fill} from 'ol/style';

/* eslint-disable angular/on-watch */
export default ['$timeout', '$rootScope', 'hs.map.service', 'hs.layout.service',
  function ($timeout, $rootScope, hsMap, layoutService) {
    const me = this;

    function mapPointerMoved(evt) {
      const features = me.extentLayer.getSource().getFeaturesAtCoordinate(evt.coordinate);
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
        $timeout(() => { }, 0);
      }
    }

    function init(map) {
      map.on('pointermove', mapPointerMoved);
      map.addLayer(me.extentLayer);
    }

    hsMap.loaded().then(init);

    $rootScope.$on('core.mainpanel_changed', (event) => {
      if (angular.isDefined(me.extentLayer)) {
        if (layoutService.mainpanel === 'composition_browser' || layoutService.mainpanel === 'composition') {
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
          return [new Style({
            stroke: new Stroke({
              color: '#005CB6',
              width: feature.get('highlighted') ? 4 : 1
            }),
            fill: new Fill({
              color: 'rgba(0, 0, 255, 0.01)'
            })
          })];
        }
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
        if (angular.isDefined(feature.get('is_hs_composition_extent')) && angular.isDefined(feature.get('record'))) {
          const record = feature.get('record');
          feature.set('highlighted', false);
          selector.getFeatures().clear();
          return record;
        }
      }
    });
  }
];
