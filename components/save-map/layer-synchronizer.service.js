import {Vector as VectorSource} from 'ol/source';
import {WFS} from 'ol/format';
const debounceInterval = 1000;

/**
 * @param HsUtilsService
 * @param HsLaymanService
 * @param HsCommonEndpointsService
 * @param $compile
 * @param $rootScope
 * @param HsLayoutService
 */
export default function (
  HsUtilsService,
  HsLaymanService,
  HsCommonEndpointsService,
  $compile,
  $rootScope,
  HsLayoutService
) {
  'ngInject';
  const me = this;
  angular.extend(me, {
    syncedLayers: [],
    crs: null,

    init(map) {
      const layerAdded = (e) => me.addLayer(e.element);
      map.getLayers().on('add', layerAdded);
      map.getLayers().on('remove', (e) => {
        me.removeLayer(e.element);
      });
      map.getLayers().forEach((lyr) => {
        layerAdded({
          element: lyr,
        });
      });
      me.crs = map.getView().getProjection().getCode();
      HsLaymanService.crs = me.crs;
    },

    /**
     * Start synchronizing layer to database
     *
     * @memberof HsLayerSynchronizerService
     * @function addLayer
     * @param {object} layer Layer to add
     */
    addLayer: function (layer) {
      const synchronizable = me.startMonitoring(layer);
      if (synchronizable) {
        me.syncedLayers.push(layer);
      }
    },

    /**
     * Keep track of synchronized vector layers by listening to
     * VectorSources change events. Initialy also get features from server
     *
     * @memberof HsLayerSynchronizerService
     * @function startMonitoring
     * @param {object} layer Layer to add
     * @returns {boolean} If layer is synchronizable
     */
    startMonitoring(layer) {
      if (
        HsUtilsService.instOf(layer.getSource(), VectorSource) &&
        layer.get('synchronize') === true
      ) {
        const layerSource = layer.getSource();
        me.pull(layer, layerSource);
        return true;
      }
    },

    /**
     * Get features from Layman endpoint as WFS string, parse and add
     * them to Openlayers VectorSource
     *
     * @memberof HsLayerSynchronizerService
     * @function pull
     * @param {Ol.layer} layer Layer to get Layman friendly name for
     * @param {Ol.source} source Openlayers VectorSource to store features in
     */
    pull(layer, source) {
      (HsCommonEndpointsService.endpoints || [])
        .filter((ds) => ds.type == 'layman')
        .forEach((ds) => {
          layer.set('hs-layman-synchronizing', true);
          HsLaymanService.pullVectorSource(ds, HsLaymanService.getLaymanFriendlyLayerName(layer.get('title'))).then(
            (response) => {
              let featureString;
              if (response) {
                featureString = response.data;
              }
              layer.set('hs-layman-synchronizing', false);
              if (featureString) {
                source.loading = true;
                const format = new WFS();
                featureString = featureString.replaceAll(
                  'urn:x-ogc:def:crs:EPSG:3857',
                  'EPSG:3857'
                );
                source.addFeatures(format.readFeatures(featureString));
                source.loading = false;
              }
              /**
               * @param e
               */
              function handleFeatureChange(e) {
                sync([], [e.target || e], []);
              }
              /**
               * @param inserted
               * @param updated
               * @param deleted
               */
              function sync(inserted, updated, deleted) {
                (HsCommonEndpointsService.endpoints || [])
                  .filter((ds) => ds.type == 'layman')
                  .forEach((ds) => {
                    layer.set('hs-layman-synchronizing', true);
                    HsLaymanService.createWfsTransaction(
                      ds,
                      inserted,
                      updated,
                      deleted,
                      HsLaymanService.getLaymanFriendlyLayerName(layer.get('title')),
                      layer
                    ).then((response) => {
                      if (response.data.indexOf('Exception') > -1) {
                        me.displaySyncErrorDialog(response.data);
                      }
                      layer.set('hs-layman-synchronizing', false);
                    });
                  });
              }
              /**
               * @param f
               */
              function observeFeature(f) {
                f.getGeometry().on(
                  'change',
                  HsUtilsService.debounce(
                    (geom) => {
                      handleFeatureChange(f);
                    },
                    debounceInterval,
                    false,
                    me
                  )
                );
                f.on('propertychange', handleFeatureChange);
              }
              source.forEachFeature(observeFeature);
              source.on('addfeature', (e) => {
                sync([e.feature], [], []);
              });
              source.on('removefeature', (e) => {
                sync([], [], [e.feature]);
              });
            }
          );
        });
    },

    displaySyncErrorDialog(error) {
      const scope = $rootScope.$new();
      Object.assign(scope, {
        error,
      });
      const el = angular.element(
        '<hs-sync-error-dialog exception="error"></hs-sync-error-dialog>'
      );
      HsLayoutService.contentWrapper
        .querySelector('.hs-dialog-area')
        .appendChild(el[0]);
      $compile(el)(scope);
    },

    /**
     * Stop synchronizing layer to database
     *
     * @memberof HsLayerSynchronizerService
     * @function removeLayer
     * @param {Ol.layer} layer Layer to remove from legend
     */
    removeLayer: function (layer) {
      for (let i = 0; i < me.syncedLayers.length; i++) {
        if (me.syncedLayers[i] == layer) {
          me.syncedLayers.splice(i, 1);
          break;
        }
      }
    },
  });

  return me;
}
