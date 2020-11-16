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
    public HsUtilsService: HsUtilsService,
    public HsLaymanService: HsLaymanService,
    public HsCommonEndpointsService: HsCommonEndpointsService,
    public HsDialogContainerService: HsDialogContainerService,
    public HsMapService: HsMapService,
    public HsCommonLaymanService: HsCommonLaymanService
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

  private reloadLayersOnAuthChange() {
    for (const layer of this.syncedLayers) {
      const layerSource = layer.getSource();
      layer.set('laymanLayerDescriptor', undefined);
      layerSource.clear();
      this.pull(layer, layerSource);
    }
  }

  /**
   * Start synchronizing layer to database
   *
   * @memberof HsLayerSynchronizerService
   * @function addLayer
   * @param {object} layer Layer to add
   */
  addLayer(layer: Layer): void {
    if (this.isLayerSynchronizable(layer)) {
      this.syncedLayers.push(layer);
      this.startMonitoringIfNeeded(layer);
    }
  }

  isLayerSynchronizable(layer: Layer): boolean {
    const definition = layer.get('definition');
    return (
      this.HsUtilsService.instOf(layer.getSource(), VectorSource) &&
      definition?.format.toLowerCase().includes('wfs')
    );
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
    const layerSource = layer.getSource();
    await this.pull(layer, layerSource);
    layerSource.forEachFeature((f) => this.observeFeature(f));
    layerSource.on('addfeature', (e) => {
      this.sync([e.feature], [], [], layer);
      if (e.feature) {
        this.observeFeature(e.feature);
      }
    });
    layerSource.on('removefeature', (e) => {
      this.sync([], [], [e.feature], layer);
    });
    return true;
  }

  findLaymanForWfsLayer(layer: Layer) {
    const layerDefinition = layer.get('definition');
    return (this.HsCommonEndpointsService.endpoints || [])
      .filter(
        (ds) => ds.type == 'layman' && layerDefinition?.url.includes(ds.url)
      )
      .pop();
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
    layer.set('events-suspended', (layer.get('events-suspended') || 0) + 1);
    const laymanEndpoint = this.findLaymanForWfsLayer(layer);
    if (laymanEndpoint) {
      layer.set('hs-layman-synchronizing', true);
      const response: string = await this.HsLaymanService.pullVectorSource(
        laymanEndpoint,
        this.HsLaymanService.getLayerName(layer),
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
    if ((layer.get('events-suspended') || 0) > 0) {
      return;
    }
    const laymanEndpoint = this.findLaymanForWfsLayer(layer);
    if (laymanEndpoint) {
      layer.set('hs-layman-synchronizing', true);
      this.HsLaymanService.createWfsTransaction(
        laymanEndpoint,
        inserted,
        updated,
        deleted,
        this.HsLaymanService.getLayerName(layer),
        layer
      ).then((response: string) => {
        if (response.indexOf('Exception') > -1) {
          this.displaySyncErrorDialog(response);
        }
        if (inserted[0]) {
          const id = new DOMParser()
            .parseFromString(response, 'application/xml')
            .getElementsByTagName('ogc:FeatureId')[0]
            .getAttribute('fid');
          inserted[0].setId(id);

          const geometry = inserted[0].getGeometry();
          inserted[0].setGeometryName('wkb_geometry');
          inserted[0].setGeometry(geometry);
          inserted[0].unset('geometry', true);
        }
        layer.set('hs-layman-synchronizing', false);
      });
    }
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
