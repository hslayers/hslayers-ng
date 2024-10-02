import {Injectable} from '@angular/core';

import * as xml2Json from 'xml-js';
import {Feature} from 'ol';
import {Geometry} from 'ol/geom';
import {ObjectEvent} from 'ol/Object';
import {Vector as VectorLayer} from 'ol/layer';
import {Vector as VectorSource} from 'ol/source';

import {HsCommonLaymanService} from 'hslayers-ng/common/layman';
import {HsEventBusService} from 'hslayers-ng/services/event-bus';
import {HsLanguageService} from 'hslayers-ng/services/language';
import {HsLaymanService} from './layman.service';
import {HsLogService} from 'hslayers-ng/services/log';
import {HsMapService} from 'hslayers-ng/services/map';
import {HsToastService} from 'hslayers-ng/common/toast';
import {HsUtilsService} from 'hslayers-ng/services/utils';
import {awaitLayerSync, isLaymanUrl} from 'hslayers-ng/common/layman';
import {
  getDefinition,
  getEventsSuspended,
  getName,
  getWorkspace,
  setEventsSuspended,
  setHsLaymanSynchronizing,
  setLaymanLayerDescriptor,
} from 'hslayers-ng/common/extensions';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root',
})
export class HsLayerSynchronizerService {
  debounceInterval = 1000;
  crs: string;
  syncedLayers: VectorLayer<VectorSource<Feature>>[] = [];
  constructor(
    private hsUtilsService: HsUtilsService,
    private hsLaymanService: HsLaymanService,
    private hsMapService: HsMapService,
    private hsCommonLaymanService: HsCommonLaymanService,
    private hsToastService: HsToastService,
    private hsLanguageService: HsLanguageService,
    private hsLogService: HsLogService,
    private hsEventBusService: HsEventBusService,
  ) {
    this.hsMapService.loaded().then((map) => {
      const layerAdded = (e) => this.addLayer(e.element);
      map.getLayers().on('add', layerAdded);
      map.getLayers().on('remove', (e) => {
        this.removeLayer(e.element as VectorLayer<VectorSource<Feature>>);
      });
      map.getLayers().forEach((lyr) => {
        layerAdded({
          element: lyr,
        });
      });
      this.hsCommonLaymanService.authChange.subscribe(() => {
        this.reloadLayersOnAuthChange();
      });
      this.crs = this.hsMapService.getCurrentProj().getCode();
      this.hsLaymanService.crs = this.crs;
    });

    this.hsEventBusService.refreshLaymanLayer
      .pipe(takeUntilDestroyed())
      .subscribe((layer) => {
        this.pull(layer, layer.getSource());
      });
  }
  /**
   * Reload all the synchronized layers after Layman's authorization change
   */
  private reloadLayersOnAuthChange(): void {
    for (const layer of this.syncedLayers) {
      const layerSource = layer.getSource();
      setLaymanLayerDescriptor(layer, undefined);
      layerSource.clear();
      this.pull(layer, layerSource);
    }
  }

  /**
   * Start synchronizing layer to database
   * @param layer - Layer to add
   */
  addLayer(layer: VectorLayer<VectorSource<Feature>>): void {
    if (this.isLayerSynchronizable(layer)) {
      this.syncedLayers.push(layer);
      this.startMonitoringIfNeeded(layer);
    }
  }

  /**
   * Check if the selected layer is synchronize-able
   * @param layer - Layer to check
   * @returns True if the layer can be synchronized, false otherwise
   */
  isLayerSynchronizable(layer: VectorLayer<VectorSource<Feature>>): boolean {
    const definition = getDefinition(layer);
    return (
      this.hsUtilsService.instOf(layer.getSource(), VectorSource) &&
      //Test whether format contains 'wfs' AND does not contain 'external'. Case insensitive
      new RegExp('^(?=.*wfs)(?:(?!external).)*$', 'i').test(
        definition?.format?.toLowerCase(),
      )
    );
  }

  /**
   * Make 'maxRetryCount' attempts to wait until the layer is available on Layman before returning.
   * Used for tasks which require layer presence on server
   */
  async layerExistsOnLayman(
    layer: VectorLayer<VectorSource<Feature>>,
    maxRetryCount = 5,
    retryCount = 0,
    desc = undefined,
  ) {
    if (!desc) {
      if (retryCount < maxRetryCount) {
        const desc = await this.hsLaymanService.describeLayer(
          this.hsCommonLaymanService.layman,
          getName(layer),
          getWorkspace(layer),
        );
        await new Promise((r) => setTimeout(r, 3000));
        return this.layerExistsOnLayman(
          layer,
          maxRetryCount,
          retryCount + 1,
          desc,
        );
      } else {
        return false;
      }
    }
    return desc;
  }

  /**
   * Keep track of synchronized vector layers by listening to
   * VectorSources change events. Initially also get features from server
   * @param layer - Layer to add
   */
  async startMonitoringIfNeeded(layer: VectorLayer<VectorSource<Feature>>) {
    const layerSource = layer.getSource();
    await this.pull(layer, layerSource);
    layer.on('propertychange', (e) => {
      if (e.key == 'sld' || e.key == 'title') {
        awaitLayerSync(layer).then(async () => {
          await this.layerExistsOnLayman(layer);
          this.hsLaymanService.upsertLayer(
            this.findLaymanForWfsLayer(layer),
            layer,
            false,
          );
        });
      }
    });
    layerSource.forEachFeature((f) => this.observeFeature(f));
    layerSource.on('addfeature', (e) => {
      this.sync(
        Array.isArray(e.feature) ? e.feature : [e.feature],
        [],
        [],
        layer,
      );
    });
    layerSource.on('removefeature', (e) => {
      this.sync([], [], [e.feature], layer);
    });
  }

  /**
   * Find Layman's endpoint description for WFS layer
   * @param layer - Layer to add
   */
  findLaymanForWfsLayer(layer: VectorLayer<VectorSource<Feature>>) {
    const definitionUrl = getDefinition(layer).url;
    const laymanEp = this.hsCommonLaymanService?.layman;
    if (!laymanEp || !definitionUrl) {
      return undefined;
    }
    return isLaymanUrl(definitionUrl, laymanEp) ? laymanEp : undefined;
  }

  /**
   * Get features from Layman's endpoint service as WFS string, parse them and add
   * them to OL VectorSource
   * @param layer - Layer to get Layman friendly name for
   * @param source - OL VectorSource to store features in
   */
  async pull(layer: VectorLayer<VectorSource<Feature>>, source: VectorSource) {
    try {
      setEventsSuspended(layer, (getEventsSuspended(layer) || 0) + 1);
      const laymanEndpoint = this.findLaymanForWfsLayer(layer);
      if (laymanEndpoint) {
        setHsLaymanSynchronizing(layer, true);
        let featureString: string =
          await this.hsLaymanService.makeGetLayerRequest(laymanEndpoint, layer);
        setHsLaymanSynchronizing(layer, false);
        if (featureString) {
          source.loading = true;
          const {default: WFS} = await import('ol/format/WFS');
          const format = new WFS({version: '2.0.0'});
          featureString = featureString.replace(
            /urn:x-ogc:def:crs:EPSG:3857/gm,
            'EPSG:3857',
          );

          featureString = featureString.replace(
            /http:\/\/www\.opengis\.net\/gml\/srs\/epsg\.xml#/g,
            'EPSG:',
          );

          try {
            const features = format.readFeatures(featureString).map((f) => {
              //boundedBy property generated by Geoserver breaks WFS-T
              f.unset('boundedBy', true);
              return f;
            });
            source.addFeatures(features);
            features.forEach((f) => this.observeFeature(f));
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
   */
  observeFeature(f: Feature<Geometry>): void {
    f.getGeometry().on(
      'change',
      this.hsUtilsService.debounce(
        () => {
          this.handleFeatureChange(f);
        },
        this.debounceInterval,
        false,
        this,
      ),
    );
    f.on('propertychange', (e: ObjectEvent) =>
      this.handleFeaturePropertyChange(e.target as Feature<Geometry>),
    );
  }

  /**
   * Handler for feature change event
   * @param feature - Feature whose change event was captured
   */
  handleFeatureChange(feature: Feature<Geometry>): void {
    this.sync([], [feature], [], this.hsMapService.getLayerForFeature(feature));
  }

  /**
   * Handler for feature property change event
   * @param feature - Feature whose property change event was captured
   */
  handleFeaturePropertyChange(feature: Feature<Geometry>): void {
    //NOTE Due to WFS specification, attribute addition is not possible, so we must delete the feature before.
    this.sync([], [], [feature], this.hsMapService.getLayerForFeature(feature));
    //NOTE only then we can add feature with new attributes again.
    this.sync([feature], [], [], this.hsMapService.getLayerForFeature(feature));
  }

  /**
   * Sync any feature changes inside a layer, that is being stored on Layman's service database
   * @param add - Features being added
   * @param upd - Features being uploaded
   * @param del - Features being deleted
   * @param layer - Layer interacted with
   */
  sync(
    add: Feature<Geometry>[],
    upd: Feature<Geometry>[],
    del: Feature<Geometry>[],
    layer: VectorLayer<VectorSource<Feature>>,
  ): void {
    if ((getEventsSuspended(layer) || 0) > 0) {
      return;
    }
    const ep = this.findLaymanForWfsLayer(layer);
    if (ep) {
      setHsLaymanSynchronizing(layer, true);
      this.hsLaymanService
        .sync({ep, add, upd, del, layer})
        .then((response: string) => {
          if (response?.includes('Exception')) {
            this.displaySyncErrorDialog(response);
            setHsLaymanSynchronizing(layer, false);
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
          setHsLaymanSynchronizing(layer, false);
        });
    }
  }

  /**
   * Display error dialog on synchronization failure
   * @param error - Error captured
   */
  displaySyncErrorDialog(error: string): void {
    const exception: xml2Json.Element | xml2Json.ElementCompact =
      xml2Json.xml2js(error, {compact: true});
    this.hsToastService.createToastPopupMessage(
      this.hsLanguageService.getTranslation(
        'SAVECOMPOSITION.syncErrorDialog.errorWhenSyncing',
        undefined,
      ),
      exception['ows:ExceptionReport']['ows:Exception']['ows:ExceptionText']
        ._text,
      {
        disableLocalization: true,
        serviceCalledFrom: 'HsLayerSynchronizerService',
      },
    );
  }

  /**
   * Stop synchronizing layer to database
   * @param layer - Layer to remove from synched layers list
   */
  removeLayer(layer: VectorLayer<VectorSource<Feature>>) {
    for (let i = 0; i < this.syncedLayers.length; i++) {
      if (this.syncedLayers[i] == layer) {
        this.syncedLayers.splice(i, 1);
        break;
      }
    }
  }
}
