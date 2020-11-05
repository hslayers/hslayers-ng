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
  HsLayoutService,
  HsMapService
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
      $rootScope.$on('authChange', (endpoint) => {
        me.reloadLayersOnAuthChange();
      });
      me.crs = map.getView().getProjection().getCode();
      HsLaymanService.crs = me.crs;
    },

    reloadLayersOnAuthChange() {
      for (const layer of me.syncedLayers) {
        const layerSource = layer.getSource();
        layer.set('laymanLayerDescriptor', undefined);
        layerSource.clear();
        me.pull(layer, layerSource);
      }
    },
    /**
     * Start synchronizing layer to database
     *
     * @memberof HsLayerSynchronizerService
     * @function addLayer
     * @param {object} layer Layer to add
     */
    addLayer(layer) {
      if (me.isLayerSynchronizable(layer)) {
        me.syncedLayers.push(layer);
        me.startMonitoringIfNeeded(layer);
      }
    },

    isLayerSynchronizable(layer) {
      return (
        HsUtilsService.instOf(layer.getSource(), VectorSource) &&
        layer.get('synchronize') === true
      );
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
    async startMonitoringIfNeeded(layer) {
      const layerSource = layer.getSource();
      await me.pull(layer, layerSource);
      layerSource.forEachFeature((f) => me.observeFeature(f));
      layerSource.on('addfeature', (e) => {
        me.sync([e.feature], [], [], layer);
      });
      layerSource.on('removefeature', (e) => {
        me.sync([], [], [e.feature], layer);
      });
      return true;
    },

    observeFeature(f) {
      f.getGeometry().on(
        'change',
        HsUtilsService.debounce(
          (geom) => {
            me.handleFeatureChange(f);
          },
          debounceInterval,
          false,
          me
        )
      );
      f.on('propertychange', (e) => me.handleFeatureChange(e.target));
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
    async pull(layer, source) {
      layer.set('events-suspended', (layer.get('events-suspended') || 0) + 1);
      const laymanEndpoints = (HsCommonEndpointsService.endpoints || []).filter(
        (ds) => ds.type == 'layman'
      );
      if (laymanEndpoints.length > 0) {
        const ds = laymanEndpoints[0];
        layer.set('hs-layman-synchronizing', true);
        const response = await HsLaymanService.pullVectorSource(
          ds,
          HsLaymanService.getLayerName(layer),
          layer
        );
        let featureString;
        if (response) {
          featureString = response;
        }
        layer.set('hs-layman-synchronizing', false);
        if (featureString) {
          source.loading = true;
          const format = new WFS();
          featureString = featureString.replace(
            /urn:x-ogc:def:crs:EPSG:3857/gm,
            'EPSG:3857'
          );
          try {
            const features = format.readFeatures(featureString);
            source.addFeatures(features);
            features.forEach((f) => this.observeFeature(f));
          } catch (ex) {
            console.warn(featureString, ex);
          }
          source.loading = false;
        }
      }
      layer.set('events-suspended', (layer.get('events-suspended') || 0) - 1);
    },

    handleFeatureChange(feature) {
      me.sync([], [feature], [], HsMapService.getLayerForFeature(feature));
    },

    /**
     * @param inserted
     * @param updated
     * @param deleted
     * @param layer
     */
    sync(inserted, updated, deleted, layer) {
      if ((layer.get('events-suspended') || 0) > 0) {
        return;
      }
      (HsCommonEndpointsService.endpoints || [])
        .filter((ds) => ds.type == 'layman')
        .forEach((ds) => {
          layer.set('hs-layman-synchronizing', true);
          HsLaymanService.createWfsTransaction(
            ds,
            inserted,
            updated,
            deleted,
            HsLaymanService.getLayerName(layer),
            layer
          ).then((response) => {
            if (response.indexOf('Exception') > -1) {
              me.displaySyncErrorDialog(response);
            }
            layer.set('hs-layman-synchronizing', false);
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
