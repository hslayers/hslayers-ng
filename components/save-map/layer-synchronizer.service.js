import {Vector as VectorSource} from 'ol/source';
import {WFS} from 'ol/format';
const debounceInterval = 1000;

export default [
  'hs.utils.service',
  'hs.laymanService',
  'hs.common.endpointsService',
  '$compile',
  '$rootScope',
  'hs.layout.service',
  function (
    utils,
    laymanService,
    endpointsService,
    $compile,
    $rootScope,
    layoutService
  ) {
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
        laymanService.crs = me.crs;
      },

      /**
       * Start synchronizing layer to database
       * @memberof hs.layerSynchronizerService
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
       * @memberof hs.layerSynchronizerService
       * @function startMonitoring
       * @param {object} layer Layer to add
       * @returns {Boolean} If layer is synchronizable
       */
      startMonitoring(layer) {
        if (
          utils.instOf(layer.getSource(), VectorSource) &&
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
       * @memberof hs.layerSynchronizerService
       * @function pull
       * @param {Ol.layer} layer Layer to get Layman friendly name for
       * @param {Ol.source} source Openlayers VectorSource to store features in
       */
      pull(layer, source) {
        (endpointsService.endpoints || [])
          .filter((ds) => ds.type == 'layman')
          .forEach((ds) => {
            layer.set('hs-layman-synchronizing', true);
            laymanService
              .pullVectorSource(ds, me.getLayerName(layer))
              .then((response) => {
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
                function handleFeatureChange(e) {
                  sync([], [e.target || e], []);
                }
                function sync(inserted, updated, deleted) {
                  (endpointsService.endpoints || [])
                    .filter((ds) => ds.type == 'layman')
                    .forEach((ds) => {
                      layer.set('hs-layman-synchronizing', true);
                      laymanService
                        .createWfsTransaction(
                          ds,
                          inserted,
                          updated,
                          deleted,
                          me.getLayerName(layer),
                          layer
                        )
                        .then((response) => {
                          if (response.data.indexOf('Exception') > -1) {
                            me.displaySyncErrorDialog(response.data);
                          }
                          layer.set('hs-layman-synchronizing', false);
                        });
                    });
                }
                function observeFeature(f) {
                  f.getGeometry().on(
                    'change',
                    utils.debounce(
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
              });
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
        layoutService.contentWrapper
          .querySelector('.hs-dialog-area')
          .appendChild(el[0]);
        $compile(el)(scope);
      },

      /**
       * Get Layman friendly name for layer based on its title by
       * removing spaces, converting to lowercase
       * @memberof hs.layerSynchronizerService
       * @function getLayerName
       * @param {Ol.layer} layer Layer to get Layman friendly name for
       * @returns {String} Layer title
       */
      getLayerName(layer) {
        return layer.get('title').toLowerCase().replaceAll(' ', '');
      },

      /**
       * Stop synchronizing layer to database
       * @memberof hs.layerSynchronizerService
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
  },
];
