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
export class HsLayerSynchronizerService {
  constructor(
    HsUtilsService,
    HsLaymanService,
    HsCommonEndpointsService,
    $compile,
    $rootScope,
    HsLayoutService
  ) {
    'ngInject';
    Object.assign(this, {
      HsUtilsService,
      HsLaymanService,
      HsCommonEndpointsService,
      $compile,
      $rootScope,
      HsLayoutService,
    });

    const me = this;
    angular.extend(me, {
      syncedLayers: [],
      crs: null,
    });
  }

  init(map) {
    const layerAdded = (e) => this.addLayer(e.element);
    map.getLayers().on('add', layerAdded);
    map.getLayers().on('remove', (e) => {
      this.removeLayer(e.element);
    });
    map.getLayers().forEach((lyr) => {
      layerAdded({
        element: lyr,
      });
    });
    this.crs = map.getView().getProjection().getCode();
    this.HsLaymanService.crs = this.crs;
  }

  /**
   * Start synchronizing layer to database
   *
   * @memberof HsLayerSynchronizerService
   * @function addLayer
   * @param {object} layer Layer to add
   */
  addLayer(layer) {
    const synchronizable = this.startMonitoring(layer);
    if (synchronizable) {
      this.syncedLayers.push(layer);
    }
  }

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
      this.HsUtilsService.instOf(layer.getSource(), VectorSource) &&
      layer.get('synchronize') === true
    ) {
      const layerSource = layer.getSource();
      this.pull(layer, layerSource);
      return true;
    }
  }

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
    (this.HsCommonEndpointsService.endpoints || [])
      .filter((ds) => ds.type == 'layman')
      .forEach((ds) => {
        layer.set('hs-layman-synchronizing', true);
        this.HsLaymanService.pullVectorSource(
          ds,
          this.getLayerName(layer)
        ).then((response) => {
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

          source.forEachFeature((f) => this.observeFeature(f));
          source.on('addfeature', (e) => {
            this.sync([e.feature], [], [], layer);
          });
          source.on('removefeature', (e) => {
            this.sync([], [], [e.feature], layer);
          });
        });
      });
  }

  /**
   * @param f
   */
  observeFeature(f) {
    f.getGeometry().on(
      'change',
      this.HsUtilsService.debounce(
        (geom) => {
          this.handleFeatureChange(f);
        },
        debounceInterval,
        false,
        this
      )
    );
    f.on('propertychange', this.handleFeatureChange);
  }

  /**
   * @param e
   */
  handleFeatureChange(e) {
    this.sync([], [e.target || e], []);
  }

  /**
   * @param inserted
   * @param updated
   * @param deleted
   */
  sync(inserted, updated, deleted, layer) {
    (this.HsCommonEndpointsService.endpoints || [])
      .filter((ds) => ds.type == 'layman')
      .forEach((ds) => {
        layer.set('hs-layman-synchronizing', true);
        this.HsLaymanService.createWfsTransaction(
          ds,
          inserted,
          updated,
          deleted,
          this.getLayerName(layer),
          layer
        ).then((response) => {
          if (response.data.indexOf('Exception') > -1) {
            this.displaySyncErrorDialog(response.data);
          }
          layer.set('hs-layman-synchronizing', false);
        });
      });
  }

  displaySyncErrorDialog(error) {
    const scope = this.$rootScope.$new();
    Object.assign(scope, {
      error,
    });
    const el = angular.element(
      '<hs-sync-error-dialog exception="error"></hs-sync-error-dialog>'
    );
    this.HsLayoutService.contentWrapper
      .querySelector('.hs-dialog-area')
      .appendChild(el[0]);
    this.$compile(el)(scope);
  }

  /**
   * Get Layman friendly name for layer based on its title by
   * removing spaces, converting to lowercase
   *
   * @memberof HsLayerSynchronizerService
   * @function getLayerName
   * @param {Ol.layer} layer Layer to get Layman friendly name for
   * @returns {string} Layer title
   */
  getLayerName(layer) {
    return layer.get('title').toLowerCase().replaceAll(' ', '');
  }

  /**
   * Stop synchronizing layer to database
   *
   * @memberof HsLayerSynchronizerService
   * @function removeLayer
   * @param {Ol.layer} layer Layer to remove from legend
   */
  removeLayer(layer) {
    for (let i = 0; i < this.syncedLayers.length; i++) {
      if (this.syncedLayers[i] == layer) {
        this.syncedLayers.splice(i, 1);
        break;
      }
    }
  }
}
