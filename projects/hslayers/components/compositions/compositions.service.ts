import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Injectable, inject} from '@angular/core';

import {Feature} from 'ol';
import {Geometry} from 'ol/geom';
import {Observable, Subject, lastValueFrom} from 'rxjs';

import {DuplicateHandling, HsMapService} from 'hslayers-ng/services/map';
import {HS_PRMS, HsShareUrlService} from 'hslayers-ng/services/share';
import {HsCommonEndpointsService} from 'hslayers-ng/services/endpoints';
import {HsCompositionsLaymanService} from './endpoints/compositions-layman.service';
import {HsCompositionsMapService} from './compositions-map.service';
import {HsCompositionsMickaService} from './endpoints/compositions-micka.service';
import {HsCompositionsParserService} from 'hslayers-ng/services/compositions';
import {HsConfig} from 'hslayers-ng/config';
import {HsEndpoint, HsMapCompositionDescriptor} from 'hslayers-ng/types';
import {HsEventBusService} from 'hslayers-ng/services/event-bus';
import {HsLanguageService} from 'hslayers-ng/services/language';
import {HsLayerManagerService} from 'hslayers-ng/services/layer-manager';
import {HsLogService} from 'hslayers-ng/services/log';
import {HsToastService} from 'hslayers-ng/common/toast';
import {HsProxyService} from 'hslayers-ng/services/utils';

@Injectable({
  providedIn: 'root',
})
export class HsCompositionsService {
  private http = inject(HttpClient);
  private hsMapService = inject(HsMapService);
  private hsCompositionsParserService = inject(HsCompositionsParserService);
  private hsConfig = inject(HsConfig);
  private HsShareUrlService = inject(HsShareUrlService);
  private hsCompositionsMickaService = inject(HsCompositionsMickaService);
  private hsCompositionsLaymanService = inject(HsCompositionsLaymanService);
  private hsLanguageService = inject(HsLanguageService);
  private $log = inject(HsLogService);
  private hsCommonEndpointsService = inject(HsCommonEndpointsService);
  private hsCompositionsMapService = inject(HsCompositionsMapService);
  private hsEventBusService = inject(HsEventBusService);
  private hsToastService = inject(HsToastService);
  private hsLayerManagerService = inject(HsLayerManagerService);
  private hsProxyService = inject(HsProxyService);

  data: any = {};
  compositionToLoad: {url: string; title: string};
  notSavedOrEditedCompositionLoading: Subject<{url: string; record?: any}> =
    new Subject();
  compositionNotFoundAtUrl: Subject<any> = new Subject();
  shareId: string;
  constructor() {
    this.hsEventBusService.compositionEdits.subscribe(() => {
      this.hsCompositionsParserService.composition_edited = true;
    });

    this.hsEventBusService.compositionLoadStarts.subscribe((id) => {
      id = `${this.HsShareUrlService.endpointUrl()}?request=load&id=${id}`;
      this.hsCompositionsParserService.loadUrl(id);
    });

    const permalink = this.HsShareUrlService.getParamValue(HS_PRMS.permalink);
    if (permalink) {
      this.parsePermalinkLayers(permalink);
    } else {
      this.tryParseCompositionFromUrlParam();
    }

    if (this.hsConfig.base_layers && !permalink) {
      this.loadBaseLayersComposition();
    }

    if (this.hsConfig.saveMapStateOnReload && !permalink) {
      //Load composition data from cookies only if it is anticipated
      setTimeout(() => {
        this.tryParseCompositionFromCookie();
      }, 500);
    }
    this.hsEventBusService.mapResets.subscribe(() => {
      this.hsCompositionsParserService.composition_loaded = null;
      this.hsCompositionsParserService.composition_edited = false;

      if (this.hsConfig.base_layers && !permalink) {
        this.loadBaseLayersComposition();
      }
      this.tryParseCompositionFromUrlParam();
    });
  }

  /**
   * Load composition list
   * @param ds - Datasource endpoint
   * @param params - Provided params for querying list items
   */
  loadCompositions(ds: HsEndpoint, params): Observable<any> {
    this.hsCompositionsMapService.clearExtentLayer();
    const bbox = this.hsMapService.getMapExtentInEpsg4326();
    const Observable = this.managerByType(ds).loadList(
      ds,
      params,
      (feature: Feature<Geometry>) =>
        this.hsCompositionsMapService.addExtentFeature(feature),
      bbox,
    );
    return Observable;
  }

  /**
   * Reset composition counters for datasource endpoints
   */
  resetCompositionCounter(): void {
    this.hsCommonEndpointsService.endpoints().forEach((ep) => {
      switch (ep.type) {
        case 'micka':
          return this.hsCompositionsMickaService.resetCompositionCounter(ep);
        case 'layman':
        case 'layman-wagtail':
          return this.hsCompositionsLaymanService.resetCompositionCounter(ep);
        default:
          this.$log.warn(`Endpoint type '${ep.type} not supported`);
      }
    });
  }

  /**
   * Find and return required service reference for each endpoint type
   * @param endpoint - Datasource endpoint
   */
  managerByType(endpoint: HsEndpoint): any {
    switch (endpoint.type) {
      case 'micka':
        return this.hsCompositionsMickaService;
      case 'layman':
      case 'layman-wagtail':
        return this.hsCompositionsLaymanService;
      default:
        this.$log.warn(`Endpoint type '${endpoint.type} not supported`);
    }
  }

  /**
   * Delete composition from datasource database
   * @param composition - Composition selected
   */
  async deleteComposition(composition): Promise<void> {
    await this.managerByType(composition.endpoint)?.delete(
      composition.endpoint,
      composition,
    );
  }

  /**
   * Share composition to other platforms
   * @param record - Datasource record selected
   */
  async shareComposition(record: HsMapCompositionDescriptor): Promise<any> {
    const recordLink = encodeURIComponent(this.getRecordLink(record));
    const permalinkOverride = this.hsConfig.permalinkLocation;
    const compositionUrl = permalinkOverride
      ? permalinkOverride.origin + permalinkOverride.pathname
      : `${location.origin}${location.pathname}?composition=${recordLink}`;
    this.shareId = crypto.randomUUID();
    const headers = new HttpHeaders().set(
      'Content-Type',
      'text/plain; charset=utf-8',
    );
    return await lastValueFrom(
      this.http.post(
        this.HsShareUrlService.endpointUrl(),
        JSON.stringify({
          request: 'socialShare',
          id: this.shareId,
          url: encodeURIComponent(compositionUrl),
          title: record.title,
          description: record.abstract,
          image: record.thumbnail || 'https://ng.hslayers.org/img/logo.png',
        }),
        {headers, responseType: 'text'},
      ),
    );
  }

  /**
   * Get composition share url
   */
  async getShareUrl(): Promise<string> {
    try {
      return await this.HsShareUrlService.shortUrl(
        this.HsShareUrlService.endpointUrl() +
          '?request=socialshare&id=' +
          this.shareId,
      );
    } catch (ex) {
      this.$log.log('Error creating short URL');
    }
  }

  /**
   * Get composition information
   * @param composition - Composition selected
   */
  async getCompositionInfo(
    composition: HsMapCompositionDescriptor,
  ): Promise<any> {
    const info = await this.managerByType(composition.endpoint).getInfo(
      composition,
    );
    this.data.info = info;
    return info;
  }

  /**
   * Get record external link
   * @param record - Datasource record selected
   */
  getRecordLink(record: HsMapCompositionDescriptor): string {
    try {
      let url;
      if (record.link !== undefined) {
        url = record.link;
      } else if (record.links !== undefined) {
        url = record.links.filter(
          (l) => l.url.includes('/file') || l.url.endsWith('.wmc'),
        )[0].url;
      }
      if (record.endpoint?.type.includes('layman')) {
        url = record.url + '/file' + '?timestamp=' + Date.now();
      }
      return url;
    } catch (e) {
      this.$log.warn(e);
    }
  }

  /**
   * Get 'report-layman' template of composition object (operatesOn property included).
   * Necessary for CSW serviceType compositions to be parsed
   */
  async getLaymanTemplateRecordObject(record) {
    const params = `?request=GetRecords&format=text/json&template=report-layman&query=ServiceType like 'CSW' and title like '${
      record.title
    }' and BoundingBox like '${record.bbox.join(' ')}'`;
    const url = this.hsProxyService.proxify(record.endpoint.url + params);

    try {
      const compositions = await lastValueFrom(
        this.http.get(url, {
          responseType: 'json',
        }),
      );
      return compositions['records'].length > 1
        ? compositions['records'].find((r) => r.id == record.id)
        : compositions['records'][0];
    } catch (e) {
      this.hsToastService.createToastPopupMessage(
        this.hsLanguageService.getTranslation(
          'COMPOSITIONS.errorWhileRequestingCompositions',
          undefined,
        ),
        record.endpoint.title +
          ': ' +
          this.hsLanguageService.getTranslationIgnoreNonExisting(
            'ERRORMESSAGES',
            e.status ? e.status.toString() : e.message,
            {url: url},
          ),
        {
          disableLocalization: true,
          serviceCalledFrom: 'HsCompositionsMickaService',
        },
      );
    }
  }

  async getRecordUrl(
    record: HsMapCompositionDescriptor,
  ): Promise<string | any> {
    const recordEndpoint = record.endpoint;
    if (recordEndpoint.type == 'micka') {
      return record.serviceType == 'CSW'
        ? await this.getLaymanTemplateRecordObject(record)
        : this.getRecordLink(record);
    }
    if (recordEndpoint.type.includes('layman')) {
      return record.url + '/file';
    }
    this.$log.warn(`Endpoint type '${recordEndpoint.type} not supported`);
    return;
  }

  /**
   * Load composition from datasource record url
   * @param record - Datasource record selected
   */
  async loadCompositionParser(
    record: HsMapCompositionDescriptor,
  ): Promise<void> {
    const url = await this.getRecordUrl(record);
    if (url) {
      if (
        this.hsCompositionsParserService.composition_edited ||
        this.hsCompositionsParserService.composition_loaded
      ) {
        this.notSavedOrEditedCompositionLoading.next({
          url: url as string,
          record,
        });
      } else {
        this.loadComposition(url, true);
      }
    }
  }

  /**
   * Parse composition by setting all  response object layers to base
   * @param response - Composition data
   */
  parseBaseLayersComposition(response) {
    return {
      ...response,
      layers: response.layers.map((l) => {
        return {
          ...l,
          base: true,
          fromComposition: false,
          visibility: false,
        };
      }),
      basemapComposition: true,
      current_base_layer: {title: this.hsConfig.base_layers.default},
    };
  }

  /**
   * Load base layers received as composition
   */
  loadBaseLayersComposition(): void {
    this.hsCompositionsParserService.loadUrl(
      this.hsConfig.base_layers.url,
      false,
      undefined,
      this.parseBaseLayersComposition.bind(this),
    );
  }

  /**
   * Load layers received through permalink to map
   */
  async parsePermalinkLayers(permalink: string): Promise<void> {
    await this.hsMapService.loaded();
    const layersUrl = this.hsProxyService.proxify(permalink);
    const response: any = await lastValueFrom(this.http.get(layersUrl));
    if (response.success == true) {
      const data: any = {};
      data.data = {};
      if (response.data.layers) {
        data.data.layers = response.data.layers;
      } else {
        //Some old structure, where layers are stored in data
        data.data.layers = response.data;
      }
      this.hsMapService.removeCompositionLayers(true);
      const layers = await this.hsCompositionsParserService.jsonToLayers(data);
      for (let i = 0; i < layers.length; i++) {
        this.hsMapService.addLayer(layers[i], DuplicateHandling.RemoveOriginal);
      }
      this.hsMapService.fitExtent(response.data.nativeExtent);
      this.hsLayerManagerService.updateLayerListPositions();
    } else {
      this.$log.log('Error loading permalink layers');
    }
  }

  /**
   * Load composition from composition list
   * @param url - URL
   * @param overwrite - Overwrite existing map composition with the new one
   */
  loadComposition(url: string, overwrite?: boolean): Promise<void> {
    return this.hsCompositionsParserService.loadUrl(url, overwrite);
  }

  /**
   * Parse and load composition from cookies
   */
  async tryParseCompositionFromCookie(): Promise<void> {
    if (
      localStorage.getItem('hs_layers') &&
      (<any>window).permalinkApp != true
    ) {
      await this.hsMapService.loaded();
      const data = localStorage.getItem('hs_layers');
      if (!data) {
        return;
      }
      const parsed = JSON.parse(data);
      if (parsed.expires && parsed.expires < new Date().getTime()) {
        return;
      }
      const layers =
        await this.hsCompositionsParserService.jsonToLayers(parsed);
      for (let i = 0; i < layers.length; i++) {
        this.hsMapService.addLayer(layers[i], DuplicateHandling.IgnoreNew);
      }
      localStorage.removeItem('hs_layers');
      this.hsLayerManagerService.updateLayerListPositions();
    }
  }

  /**
   * Parse and load composition from browser URL
   */
  async tryParseCompositionFromUrlParam(): Promise<void> {
    let id =
      this.HsShareUrlService.getParamValue(HS_PRMS.composition) ||
      this.hsConfig.defaultComposition;
    if (id) {
      if (!id.includes('http')) {
        id = this.HsShareUrlService.endpointUrl() + '?request=load&id=' + id;
      }
      try {
        const defaultViewProperties =
          this.hsConfig.default_view?.getProperties();
        const compoParserServiceRef = this.hsCompositionsParserService;

        /**
         * Little bit tricky but solution to force affect default composition loading behavior. Used to prevent
         * passing params all the way down the loading pipeline
         */
        compoParserServiceRef.loadingOptions.suspendZoomingToExtent =
          defaultViewProperties?.hasOwnProperty('center') &&
          defaultViewProperties?.hasOwnProperty('zoom');
        compoParserServiceRef.loadingOptions.suspendPanelChange =
          this.hsConfig.sidebarClosed;

        await this.hsCompositionsParserService.loadUrl(id);
        compoParserServiceRef.loadingOptions.suspendZoomingToExtent = false;
      } catch (error) {
        this.compositionNotFoundAtUrl.next(error);
        this.$log.warn(error);
      }
    }
  }

  /**
   * Get composition common id value
   * @param composition - Composition selected
   */
  commonId(composition: HsMapCompositionDescriptor): string {
    if (composition === undefined) {
      return '';
    }
    return composition.uuid || composition.id;
  }

  /**
   * Translate string value to the selected UI language
   * @param module - Locales json key
   * @param text - Locales json key value
   * @returns Translated text
   */
  translateString(module: string, text: string): string {
    return this.hsLanguageService.getTranslationIgnoreNonExisting(
      module,
      text,
      undefined,
    );
  }
}
