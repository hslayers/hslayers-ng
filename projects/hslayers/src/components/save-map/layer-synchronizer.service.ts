import * as xml2Json from 'xml-js';
import {Feature, Map} from 'ol';
import {Injectable} from '@angular/core';
import {Layer} from 'ol/layer';
import {Source, Vector as VectorSource} from 'ol/source';
import {WFS} from 'ol/format';

import {HsCommonEndpointsService} from '../../common/endpoints/endpoints.service';
import {HsCommonLaymanService} from '../../common/layman/layman.service';
import {HsDialogContainerService} from '../layout/dialogs/dialog-container.service';
import {HsLanguageService} from '../language/language.service';
import {HsLaymanService} from './layman.service';
import {HsLogService} from '../../common/log/log.service';
import {HsMapService} from '../map/map.service';
import {HsToastService} from '../layout/toast/toast.service';
import {HsUtilsService} from '../utils/utils.service';
import {
  getDefinition,
  getEventsSuspended,
  setEventsSuspended,
} from '../../common/layer-extensions';

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
    public HsCommonLaymanService: HsCommonLaymanService,
    public HsToastService: HsToastService,
    public HsLanguageService: HsLanguageService,
    private HsLogService: HsLogService
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
    this.crs = this.HsMapService.getCurrentProj().getCode();
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
   * @memberof HsLayerSynchronizerService
   * @param {object} layer Layer to add
   */
  addLayer(layer: Layer): void {
    if (this.isLayerSynchronizable(layer)) {
      this.syncedLayers.push(layer);
      this.startMonitoringIfNeeded(layer);
    }
  }

  isLayerSynchronizable(layer: Layer): boolean {
    const definition = getDefinition(layer);
    return (
      this.HsUtilsService.instOf(layer.getSource(), VectorSource) &&
      definition?.format?.toLowerCase().includes('wfs')
    );
  }

  /**
   * Keep track of synchronized vector layers by listening to
   * VectorSources change events. Initialy also get features from server
   * @param layer Layer to add
   * @returns If layer is synchronizable
   */
  async startMonitoringIfNeeded(layer: Layer): Promise<boolean> {
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

  findLaymanForWfsLayer(layer: Layer) {
    const layerDefinition = getDefinition(layer);
    return (this.HsCommonEndpointsService.endpoints || [])
      .filter(
        (ds) => ds.type == 'layman' && layerDefinition?.url.includes(ds.url)
      )
      .pop();
  }

  /**
   * Get features from Layman endpoint as WFS string, parse and add
   * them to Openlayers VectorSource
   * @param layer Layer to get Layman friendly name for
   * @param source Openlayers VectorSource to store features in
   */
  async pull(layer: Layer, source: Source): Promise<void> {
    try {
      setEventsSuspended(layer, (getEventsSuspended(layer) || 0) + 1);
      const laymanEndpoint = this.findLaymanForWfsLayer(layer);
      if (laymanEndpoint) {
        layer.set('hs-layman-synchronizing', true);
        const response: string = await this.HsLaymanService.makeGetLayerRequest(
          laymanEndpoint,
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
          featureString = featureString.replaceAll(
            'http://www.opengis.net/gml/srs/epsg.xml#',
            'EPSG:'
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
    } catch (ex) {
      this.HsLogService.warn(`Layer ${layer} could not be pulled.`);
    } finally {
      setEventsSuspended(layer, (getEventsSuspended(layer) || 0) - 1);
    }
  }

  /**
   * @param f
   */
  observeFeature(f: Feature): void {
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
   * @param add
   * @param upd
   * @param del
   * @param layer
   */
  sync(add: Feature[], upd: Feature[], del: Feature[], layer: Layer): void {
    if ((getEventsSuspended(layer) || 0) > 0) {
      return;
    }
    const ep = this.findLaymanForWfsLayer(layer);
    if (ep) {
      layer.set('hs-layman-synchronizing', true);
      this.HsLaymanService.sync({ep, add, upd, del, layer}).then(
        (response: string) => {
          if (response?.includes('Exception')) {
            this.displaySyncErrorDialog(response);
            return;
          }
          if (add[0]) {
            const id = new DOMParser()
              .parseFromString(response, 'application/xml')
              .getElementsByTagName('ogc:FeatureId')[0]
              .getAttribute('fid');
            add[0].setId(id);

            const geometry = add[0].getGeometry();
            add[0].setGeometryName('wkb_geometry');
            add[0].setGeometry(geometry);
            add[0].unset('geometry', true);

            this.observeFeature(add[0]);
          }
          layer.set('hs-layman-synchronizing', false);
        }
      );
    }
  }

  displaySyncErrorDialog(error: string): void {
    const exception: any = xml2Json.xml2js(error, {compact: true});
    this.HsToastService.createToastPopupMessage(
      this.HsLanguageService.getTranslation(
        'SAVECOMPOSITION.syncErrorDialog.errorWhenSyncing'
      ),
      exception['ows:ExceptionReport']['ows:Exception']['ows:ExceptionText']
        ._text
    );
  }

  /**
   * Stop synchronizing layer to database
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
