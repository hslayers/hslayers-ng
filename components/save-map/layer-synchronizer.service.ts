import Feature from 'ol/Feature';
import Map from 'ol/Map';
import {Injectable} from '@angular/core';
import {Layer} from 'ol/layer';
import {Source, Vector as VectorSource} from 'ol/source';
import {WFS} from 'ol/format';

import {HsCommonEndpointsService} from '../../common/endpoints/endpoints.service';
import {HsCommonLaymanService} from '../../common/layman/layman.service';
import {HsDialogContainerService} from '../layout/dialogs/dialog-container.service';
import {HsLaymanService} from './layman.service';
import {HsMapService} from '../map/map.service';
import {HsSyncErrorDialogComponent} from './sync-error-dialog.component';
import {HsUtilsService} from '../utils/utils.service';

@Injectable({
  providedIn: 'root',
})
export class HsLayerSynchronizerService {
  debounceInterval = 1000;
  crs: any;
  syncedLayers: Layer[] = [];
  constructor(
    private HsUtilsService: HsUtilsService,
    private HsLaymanService: HsLaymanService,
    private HsCommonEndpointsService: HsCommonEndpointsService,
    private HsDialogContainerService: HsDialogContainerService,
    private HsMapService: HsMapService,
    private HsCommonLaymanService: HsCommonLaymanService
  ) {}

  init(map: Map): void {
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
    this.HsCommonLaymanService.authChange.subscribe((_) => {
      this.reloadLayersOnAuthChange();
    });
    this.crs = map.getView().getProjection().getCode();
    this.HsLaymanService.crs = this.crs;
  }

  private async reloadLayersOnAuthChange() {
    for (const layer of this.syncedLayers) {
      const layerSource = layer.getSource();
      layerSource.clear();
      await this.pull(layer, layerSource);
    }
  }

  /**
   * Start synchronizing layer to database
   *
   * @memberof HsLayerSynchronizerService
   * @function addLayer
   * @param {object} layer Layer to add
   */
  async addLayer(layer: Layer): Promise<void> {
    const synchronizable = await this.startMonitoringIfNeeded(layer);
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
  async startMonitoringIfNeeded(layer: Layer): Promise<boolean> {
    if (
      this.HsUtilsService.instOf(layer.getSource(), VectorSource) &&
      layer.get('synchronize') === true
    ) {
      const layerSource = layer.getSource();
      await this.pull(layer, layerSource);
      layerSource.forEachFeature((f) => this.observeFeature(f));
      layerSource.on('addfeature', (e) => {
        this.sync([e.feature], [], [], layer);
      });
      layerSource.on('removefeature', (e) => {
        this.sync([], [], [e.feature], layer);
      });
      return true;
    }
  }

  /**
   * @description Get features from Layman endpoint as WFS string, parse and add
   * them to Openlayers VectorSource
   * @memberof HsLayerSynchronizerService
   * @function pull
   * @param {Layer} layer Layer to get Layman friendly name for
   * @param {Source} source Openlayers VectorSource to store features in
   */
  async pull(layer: Layer, source: Source): Promise<void> {
    layer.set('events-suspended', true);
    const laymanEndpoints = (
      this.HsCommonEndpointsService.endpoints || []
    ).filter((ds) => ds.type == 'layman');
    if (laymanEndpoints.length > 0) {
      const ds = laymanEndpoints[0];
      layer.set('hs-layman-synchronizing', true);
      if ((!ds.user || ds.user == 'browser') && ds.type == 'layman') {
        await ds.getCurrentUserIfNeeded();
      }
      const response: string = await this.HsLaymanService.pullVectorSource(
        ds,
        this.HsLaymanService.getLaymanFriendlyLayerName(layer.get('title')),
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
    layer.set('events-suspended', false);
  }

  /**
   * @param f
   */
  observeFeature(f): void {
    f.getGeometry().on(
      'change',
      this.HsUtilsService.debounce(
        (geom) => {
          this.handleFeatureChange(f);
        },
        this.debounceInterval,
        false,
        this
      )
    );
    f.on('propertychange', (e) => this.handleFeatureChange(e.target));
  }

  /**
   * @param Feature
   * @param feature
   */
  handleFeatureChange(feature: Feature): void {
    this.sync([], [feature], [], this.HsMapService.getLayerForFeature(feature));
  }

  /**
   * @param inserted
   * @param updated
   * @param deleted
   * @param layer
   */
  sync(
    inserted: Feature[],
    updated: Feature[],
    deleted: Feature[],
    layer: Layer
  ): void {
    if (layer.get('events-suspended')) {
      return;
    }
    (this.HsCommonEndpointsService.endpoints || [])
      .filter((ds) => ds.type == 'layman')
      .forEach((ds) => {
        layer.set('hs-layman-synchronizing', true);
        this.HsLaymanService.createWfsTransaction(
          ds,
          inserted,
          updated,
          deleted,
          this.HsLaymanService.getLaymanFriendlyLayerName(layer.get('title')),
          layer
        ).then((response: string) => {
          if (response.indexOf('Exception') > -1) {
            this.displaySyncErrorDialog(response);
          }
          layer.set('hs-layman-synchronizing', false);
        });
      });
  }

  displaySyncErrorDialog(error: string): void {
    this.HsDialogContainerService.create(HsSyncErrorDialogComponent, {
      exception: error,
    });
  }

  /**
   * @description Stop synchronizing layer to database
   * @memberof HsLayerSynchronizerService
   * @function removeLayer
   * @param {Layer} layer Layer to remove from legend
   */
  removeLayer(layer: Layer): void {
    for (let i = 0; i < this.syncedLayers.length; i++) {
      if (this.syncedLayers[i] == layer) {
        this.syncedLayers.splice(i, 1);
        break;
      }
    }
  }
}
