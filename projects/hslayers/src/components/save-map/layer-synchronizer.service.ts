import {Injectable} from '@angular/core';

import * as xml2Json from 'xml-js';
import {Feature} from 'ol';
import {Geometry} from 'ol/geom';
import {ObjectEvent} from 'ol/Object';
import {Vector as VectorLayer} from 'ol/layer';
import {Vector as VectorSource} from 'ol/source';
import {WFS} from 'ol/format';

import {HsCommonEndpointsService} from '../../common/endpoints/endpoints.service';
import {HsCommonLaymanService} from '../../common/layman/layman.service';
import {HsEndpoint} from './../../common/endpoints/endpoint.interface';
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
  setHsLaymanSynchronizing,
  setLaymanLayerDescriptor,
} from '../../common/layer-extensions';

@Injectable({
  providedIn: 'root',
})
export class HsLayerSynchronizerService {
  debounceInterval = 1000;
  crs: string;
  syncedLayers: VectorLayer<VectorSource<Geometry>>[] = [];
  constructor(
    private hsUtilsService: HsUtilsService,
    private hsLaymanService: HsLaymanService,
    private hsCommonEndpointsService: HsCommonEndpointsService,
    private hsMapService: HsMapService,
    private hsCommonLaymanService: HsCommonLaymanService,
    private hsToastService: HsToastService,
    private hsLanguageService: HsLanguageService,
    private hsLogService: HsLogService
  ) {}

  /**
   * Initialize the LayerSynchronizerService data and subscribers
   * @param app - App identifier
   */
  async init(app: string): Promise<void> {
    await this.hsMapService.loaded(app);
    const map = this.hsMapService.getMap(app);
    const layerAdded = (e) => this.addLayer(e.element, app);
    map.getLayers().on('add', layerAdded);
    map.getLayers().on('remove', (e) => {
      this.removeLayer(e.element as VectorLayer<VectorSource>);
    });
    map.getLayers().forEach((lyr) => {
      layerAdded({
        element: lyr,
      });
    });
    this.hsCommonLaymanService.authChange.subscribe(() => {
      this.reloadLayersOnAuthChange(app);
    });
    this.crs = this.hsMapService.getCurrentProj(app).getCode();
    this.hsLaymanService.crs = this.crs;
  }

  /**
   * Reload all the synchronized layers after Layman's authorization change
   * @param app - App identifier
   */
  private reloadLayersOnAuthChange(app: string): void {
    for (const layer of this.syncedLayers) {
      const layerSource = layer.getSource();
      setLaymanLayerDescriptor(layer, undefined);
      layerSource.clear();
      this.pull(layer, layerSource, app);
    }
  }

  /**
   * Start synchronizing layer to database
   * @param layer - Layer to add
   * @param app - App identifier
   */
  addLayer(layer: VectorLayer<VectorSource<Geometry>>, app: string): void {
    if (this.isLayerSynchronizable(layer)) {
      this.syncedLayers.push(layer);
      this.startMonitoringIfNeeded(layer, app);
    }
  }

  /**
   * Check if the selected layer is synchronizable
   * @param layer - Layer to check
   * @returns True if the layer can be synchronized, false otherwise
   */
  isLayerSynchronizable(layer: VectorLayer<VectorSource<Geometry>>): boolean {
    const definition = getDefinition(layer);
    return (
      this.hsUtilsService.instOf(layer.getSource(), VectorSource) &&
      //Test whether fromat cointains 'wfs' AND does not contian 'external'. Case insensitive
      new RegExp('^(?=.*wfs)(?:(?!external).)*$', 'i').test(
        definition?.format?.toLowerCase()
      )
    );
  }

  /**
   * Keep track of synchronized vector layers by listening to
   * VectorSources change events. Initially also get features from server
   * @param layer - Layer to add
   * @param app - App identifier
   */
  async startMonitoringIfNeeded(
    layer: VectorLayer<VectorSource<Geometry>>,
    app: string
  ): Promise<void> {
    const layerSource = layer.getSource();
    await this.pull(layer, layerSource, app);
    layer.on('propertychange', (e) => {
      if (e.key == 'sld' || e.key == 'title') {
        this.hsLaymanService.upsertLayer(
          this.findLaymanForWfsLayer(layer),
          layer,
          false,
          app
        );
      }
    });
    layerSource.forEachFeature((f) => this.observeFeature(f, app));
    layerSource.on('addfeature', (e) => {
      this.sync(
        Array.isArray(e.feature) ? e.feature : [e.feature],
        [],
        [],
        layer,
        app
      );
    });
    layerSource.on('removefeature', (e) => {
      this.sync([], [], [e.feature], layer, app);
    });
  }

  /**
   * Find Layman's endpoint description for WFS layer
   * @param layer - Layer to add
   */
  findLaymanForWfsLayer(
    layer: VectorLayer<VectorSource<Geometry>>
  ): HsEndpoint {
    const layerDefinition = getDefinition(layer);
    return (this.hsCommonEndpointsService.endpoints || [])
      .filter(
        (ds) => ds.type == 'layman' && layerDefinition?.url?.includes(ds.url)
      )
      .pop();
  }

  /**
   * Get features from Layman's endpoint service as WFS string, parse them and add
   * them to OL VectorSource
   * @param layer - Layer to get Layman friendly name for
   * @param source - OL VectorSource to store features in
   * @param app - App identifier
   */
  async pull(
    layer: VectorLayer<VectorSource<Geometry>>,
    source: VectorSource<Geometry>,
    app: string
  ): Promise<void> {
    try {
      setEventsSuspended(layer, (getEventsSuspended(layer) || 0) + 1);
      const laymanEndpoint = this.findLaymanForWfsLayer(layer);
      if (laymanEndpoint) {
        setHsLaymanSynchronizing(layer, true);
        const response: string = await this.hsLaymanService.makeGetLayerRequest(
          laymanEndpoint,
          layer,
          app
        );
        let featureString;
        if (response) {
          featureString = response;
        }
        setHsLaymanSynchronizing(layer, false);
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
            features.forEach((f) => this.observeFeature(f, app));
          } catch (ex) {
            this.hsLogService.warn(featureString, ex);
          }
          source.loading = false;
        }
      }
    } catch (ex) {
      this.hsLogService.warn(`Layer ${layer} could not be pulled.`);
    } finally {
      setEventsSuspended(layer, (getEventsSuspended(layer) || 0) - 1);
    }
  }

  /**
   * Observe feature changes and execute handler for them
   * @param f - Feature to observe
   * @param app - App identifier
   */
  observeFeature(f: Feature<Geometry>, app: string): void {
    f.getGeometry().on(
      'change',
      this.hsUtilsService.debounce(
        () => {
          this.handleFeatureChange(f, app);
        },
        this.debounceInterval,
        false,
        this
      )
    );
    f.on('propertychange', (e: ObjectEvent) =>
      this.handleFeaturePropertyChange(e.target as Feature<Geometry>, app)
    );
  }

  /**
   * Handler for feature change event
   * @param feature - Feature whose change event was captured
   * @param app - App identifier
   */
  handleFeatureChange(feature: Feature<Geometry>, app: string): void {
    this.sync(
      [],
      [feature],
      [],
      this.hsMapService.getLayerForFeature(feature, app),
      app
    );
  }
  /**
   * Handler for feature property change event
   * @param feature - Feature whose property change event was captured
   * @param app - App identifier
   */
  handleFeaturePropertyChange(feature: Feature<Geometry>, app: string): void {
    //NOTE Due to WFS specification, attribute addition is not possible, so we must delete the feature before.
    this.sync(
      [],
      [],
      [feature],
      this.hsMapService.getLayerForFeature(feature, app),
      app
    );
    //NOTE only then we can add feature with new attributes again.
    this.sync(
      [feature],
      [],
      [],
      this.hsMapService.getLayerForFeature(feature, app),
      app
    );
  }
  /**
   * Sync any feature changes inside a layer, that is being stored on Layman's service database
   * @param add - Features being added
   * @param upd - Features being uploaded
   * @param del - Features being deleted
   * @param layer - Layer interacted with
   * @param app - App identifier
   */
  sync(
    add: Feature<Geometry>[],
    upd: Feature<Geometry>[],
    del: Feature<Geometry>[],
    layer: VectorLayer<VectorSource<Geometry>>,
    app: string
  ): void {
    if ((getEventsSuspended(layer) || 0) > 0) {
      return;
    }
    const ep = this.findLaymanForWfsLayer(layer);
    if (ep) {
      setHsLaymanSynchronizing(layer, true);
      this.hsLaymanService
        .sync({ep, add, upd, del, layer}, app)
        .then((response: string) => {
          if (response?.includes('Exception')) {
            this.displaySyncErrorDialog(response, app);
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

            this.observeFeature(add[0], app);
          }
          setHsLaymanSynchronizing(layer, false);
        });
    }
  }

  /**
   * Display error dialog on synchronization failure
   * @param error - Error captured
   * @param app - App identifier
   */
  displaySyncErrorDialog(error: string, app: string): void {
    const exception: xml2Json.Element | xml2Json.ElementCompact =
      xml2Json.xml2js(error, {compact: true});
    this.hsToastService.createToastPopupMessage(
      this.hsLanguageService.getTranslation(
        'SAVECOMPOSITION.syncErrorDialog.errorWhenSyncing',
        undefined,
        app
      ),
      exception['ows:ExceptionReport']['ows:Exception']['ows:ExceptionText']
        ._text,
      {
        disableLocalization: true,
        serviceCalledFrom: 'HsLayerSynchronizerService',
      },
      app
    );
  }

  /**
   * Stop synchronizing layer to database
   * @param layer - Layer to remove from synched layers list
   */
  removeLayer(layer: VectorLayer<VectorSource<Geometry>>): void {
    for (let i = 0; i < this.syncedLayers.length; i++) {
      if (this.syncedLayers[i] == layer) {
        this.syncedLayers.splice(i, 1);
        break;
      }
    }
  }
}
