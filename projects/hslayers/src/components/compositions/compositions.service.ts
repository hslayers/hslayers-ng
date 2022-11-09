import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Injectable} from '@angular/core';

import Feature from 'ol/Feature';
import {Geometry} from 'ol/geom';
import {Observable, Subject, lastValueFrom} from 'rxjs';

import {DuplicateHandling, HsMapService} from '../map/map.service';
import {HS_PRMS} from '../permalink/get-params';
import {HsCommonEndpointsService} from '../../common/endpoints/endpoints.service';
import {HsCompositionsLaymanService} from './endpoints/compositions-layman.service';
import {HsCompositionsMapService} from './compositions-map.service';
import {HsCompositionsMickaService} from './endpoints/compositions-micka.service';
import {HsCompositionsParserService} from './compositions-parser.service';
import {HsCompositionsStatusManagerMickaJointService} from './endpoints/status-manager-micka-joint.service';
import {HsConfig} from '../../config.service';
import {HsCoreService} from '../core/core.service';
import {HsEndpoint} from '../../common/endpoints/endpoint.interface';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLanguageService} from '../language/language.service';
import {HsLogService} from '../../common/log/log.service';
import {HsMapCompositionDescriptor} from './models/composition-descriptor.model';
import {HsShareUrlService} from '../permalink/share-url.service';
import {HsToastService} from '../layout/toast/toast.service';
import {HsUtilsService} from '../utils/utils.service';

class HsCompositionsParams {
  data: any = {};
  compositionToLoad: {url: string; title: string};
  notSavedCompositionLoading: Subject<string> = new Subject();
  compositionNotFoundAtUrl: Subject<{error: any; app: string}> = new Subject();
  shareId: string;
}
@Injectable({
  providedIn: 'root',
})
export class HsCompositionsService {
  apps: {
    [id: string]: HsCompositionsParams;
  } = {default: new HsCompositionsParams()};
  constructor(
    private http: HttpClient,
    private hsMapService: HsMapService,
    private hsCore: HsCoreService,
    private hsCompositionsParserService: HsCompositionsParserService,
    private hsConfig: HsConfig,
    private hsUtilsService: HsUtilsService,
    private HsShareUrlService: HsShareUrlService,
    private hsCompositionsMickaService: HsCompositionsMickaService,
    private hsCompositionsStatusManagerMickaJointService: HsCompositionsStatusManagerMickaJointService,
    private hsCompositionsLaymanService: HsCompositionsLaymanService,
    private hsLanguageService: HsLanguageService,
    private $log: HsLogService,
    private hsCommonEndpointsService: HsCommonEndpointsService,
    private hsCompositionsMapService: HsCompositionsMapService,
    private hsEventBusService: HsEventBusService,
    private hsToastService: HsToastService
  ) {
    this.hsEventBusService.compositionEdits.subscribe(({app}) => {
      this.hsCompositionsParserService.get(app).composition_edited = true;
    });

    this.hsEventBusService.compositionLoadStarts.subscribe(({id, app}) => {
      id = `${this.HsShareUrlService.endpointUrl(app)}?request=load&id=${id}`;
      this.hsCompositionsParserService.loadUrl(id, app);
    });
  }
  /**
   * Get the params saved by the composition service for the current app
   * @param app - App identifier
   */
  get(app: string): HsCompositionsParams {
    if (this.apps[app ?? 'default'] == undefined) {
      this.apps[app ?? 'default'] = new HsCompositionsParams();
    }
    return this.apps[app ?? 'default'];
  }
  /**
   * Initialize the composition service data and subscribers
   * @param _app - App identifier
   */
  init(_app: string) {
    const configRef = this.hsConfig.get(_app);

    const permalink = this.HsShareUrlService.getParamValue(HS_PRMS.permalink);
    permalink
      ? this.parsePermalinkLayers(permalink, _app)
      : this.tryParseCompositionFromUrlParam(_app);

    if (configRef.base_layers && !permalink) {
      this.hsEventBusService.loadBaseLayersComposition.subscribe(({app}) => {
        this.loadBaseLayersComposition(app);
      });
    }

    if (configRef.saveMapStateOnReload && !permalink) {
      //Load composition data from cookies only if it is anticipated
      setTimeout(() => {
        this.tryParseCompositionFromCookie(_app);
      }, 500);
    }
    this.hsEventBusService.mapResets.subscribe(({app}) => {
      if (app == _app) {
        this.hsCompositionsParserService.get(app).composition_loaded = null;
        this.hsCompositionsParserService.get(app).composition_edited = false;
      }
    });
    this.hsEventBusService.vectorQueryFeatureSelection.subscribe((e) => {
      if (e.app == _app) {
        for (const endpoint of this.hsCommonEndpointsService.endpoints) {
          const record =
            this.hsCompositionsMapService.getFeatureRecordAndUnhighlight(
              e.feature,
              e.selector,
              endpoint.compositions,
              _app
            );
          if (record) {
            this.loadComposition(this.getRecordLink(record), _app);
          }
        }
      }
    });
  }

  /**
   * Load composition list
   * @param ds - Datasource endpoint
   * @param params - Provided params for querying list items
   * @param app - App identifier
   */
  loadCompositions(ds: HsEndpoint, params, app: string): Observable<any> {
    this.hsCompositionsMapService.clearExtentLayer(app);
    const bbox = this.hsMapService.getMapExtentInEpsg4326(app);
    const Observable = this.managerByType(ds).loadList(
      ds,
      params,
      (feature: Feature<Geometry>) =>
        this.hsCompositionsMapService.addExtentFeature(feature, app),
      bbox,
      app
    );
    return Observable;
  }

  /**
   * Reset composition counters for datasource endpoints
   */
  resetCompositionCounter(): void {
    this.hsCommonEndpointsService.endpoints.forEach((ep) => {
      switch (ep.type) {
        case 'micka':
          return this.hsCompositionsMickaService.resetCompositionCounter(ep);
        case 'layman':
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
        return this.hsCompositionsStatusManagerMickaJointService;
      case 'layman':
        return this.hsCompositionsLaymanService;
      default:
        this.$log.warn(`Endpoint type '${endpoint.type} not supported`);
    }
  }

  /**
   * Delete composition from datasource database
   * @param composition - Composition selected
   */
  async deleteComposition(composition, app: string): Promise<void> {
    await this.managerByType(composition.endpoint)?.delete(
      composition.endpoint,
      composition,
      app
    );
  }

  /**
   * Share composition to other platforms
   * @param record - Datasource record selected
   * @param app - App identifier
   */
  async shareComposition(
    record: HsMapCompositionDescriptor,
    app: string
  ): Promise<any> {
    const appRef = this.get(app);
    const recordLink = encodeURIComponent(this.getRecordLink(record));
    const permalinkOverride = this.hsConfig.get(app).permalinkLocation;
    const compositionUrl =
      this.hsCore.isMobile() && permalinkOverride
        ? permalinkOverride.origin + permalinkOverride.pathname
        : `${location.origin}${location.pathname}?composition=${recordLink}`;
    appRef.shareId = this.hsUtilsService.generateUuid();
    const headers = new HttpHeaders().set(
      'Content-Type',
      'text/plain; charset=utf-8'
    );
    return await lastValueFrom(
      this.http.post(
        this.HsShareUrlService.endpointUrl(app),
        JSON.stringify({
          request: 'socialShare',
          id: appRef.shareId,
          url: encodeURIComponent(compositionUrl),
          title: record.title,
          description: record.abstract,
          image: record.thumbnail || 'https://ng.hslayers.org/img/logo.png',
        }),
        {headers, responseType: 'text'}
      )
    );
  }
  /**
   * Get composition share url
   * @param app - App identifier
   */
  async getShareUrl(app: string): Promise<string> {
    try {
      return await this.hsUtilsService.shortUrl(
        this.HsShareUrlService.endpointUrl(app) +
          '?request=socialshare&id=' +
          this.get(app).shareId,
        app
      );
    } catch (ex) {
      this.$log.log('Error creating short URL');
    }
  }
  /**
   * Get composition information
   * @param composition - Composition selected
   * @param app - App identifier
   */
  async getCompositionInfo(
    composition: HsMapCompositionDescriptor,
    app: string
  ): Promise<any> {
    const info = await this.managerByType(composition.endpoint).getInfo(
      composition
    );
    this.get(app).data.info = info;
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
          (l) => l.url.includes('/file') || l.url.endsWith('.wmc')
        )[0].url;
      }
      if (record.endpoint?.type == 'layman') {
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
  async getLaymanTemplateRecordObject(record, app: string) {
    const params = `?request=GetRecords&format=text/json&template=report-layman&query=ServiceType like 'CSW' and title like '${
      record.title
    }' and BoundingBox like '${record.bbox.join(' ')}'`;
    const url = this.hsUtilsService.proxify(record.endpoint.url + params, app);

    try {
      const compositions = await lastValueFrom(
        this.http.get(url, {
          responseType: 'json',
        })
      );
      return compositions['records'].length > 1
        ? compositions['records'].find((r) => r.id == record.id)
        : compositions['records'][0];
    } catch (e) {
      this.hsToastService.createToastPopupMessage(
        this.hsLanguageService.getTranslation(
          'COMPOSITIONS.errorWhileRequestingCompositions',
          undefined,
          app
        ),
        record.endpoint.title +
          ': ' +
          this.hsLanguageService.getTranslationIgnoreNonExisting(
            'ERRORMESSAGES',
            e.status ? e.status.toString() : e.message,
            {url: url},
            app
          ),
        {
          disableLocalization: true,
          serviceCalledFrom: 'HsCompositionsMickaService',
        },
        app
      );
    }
  }

  async getRecordUrl(
    record: HsMapCompositionDescriptor,
    app: string
  ): Promise<string | any> {
    const recordEndpoint = record.endpoint;
    if (recordEndpoint.type == 'micka') {
      return record.serviceType == 'CSW'
        ? await this.getLaymanTemplateRecordObject(record, app)
        : this.getRecordLink(record);
    } else if (recordEndpoint.type == 'layman') {
      return record.url + '/file';
    } else {
      this.$log.warn(`Endpoint type '${recordEndpoint.type} not supported`);
      return;
    }
  }

  /**
   * Load composition from datasource record url
   * @param record - Datasource record selected
   * @param app - App identifier
   */
  async loadCompositionParser(
    record: HsMapCompositionDescriptor,
    app: string
  ): Promise<void> {
    const url = await this.getRecordUrl(record, app);
    if (url) {
      //Provide save-map comoData workspace property and distinguish between editable and non-editable compositions
      this.hsCompositionsParserService.get(app).current_composition_workspace =
        record.editable ? record.workspace : null;
      if (
        this.hsCompositionsParserService.get(app).composition_edited == true
      ) {
        this.get(app).notSavedCompositionLoading.next(url);
      } else {
        this.loadComposition(url, app, true);
      }
    }
  }

  /**
   * Parse composition by setting all  response object layers to base
   * @param respone Compostion data
   */
  parseBaseLayersComposition({response, app}) {
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
      basemapCompostion: true,
      current_base_layer: {title: this.hsConfig.get(app).base_layers.default},
    };
  }

  /**
   * Load base layers received as composition
   * @param app - App identifier
   */
  loadBaseLayersComposition(app: string): void {
    const configRef = this.hsConfig.get(app);
    this.hsCompositionsParserService.loadUrl(
      configRef.base_layers.url,
      app,
      false,
      undefined,
      this.parseBaseLayersComposition.bind(this)
    );
  }

  /**
   * Load layers received through permalink to map
   * @param app - App identifier
   */
  async parsePermalinkLayers(permalink: string, app: string): Promise<void> {
    await this.hsMapService.loaded(app);
    const layersUrl = this.hsUtilsService.proxify(permalink, app);
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
      this.hsMapService.removeCompositionLayers(true, app);
      const layers = await this.hsCompositionsParserService.jsonToLayers(
        data,
        app
      );
      for (let i = 0; i < layers.length; i++) {
        this.hsMapService.addLayer(
          layers[i],
          app,
          DuplicateHandling.RemoveOriginal
        );
      }
      this.hsMapService.fitExtent(response.data.nativeExtent, app);
    } else {
      this.$log.log('Error loading permalink layers');
    }
  }

  /**
   * Load composition from composition list
   * @param url - URL
   * @param app - App identifier
   * @param overwrite - Overwrite existing map composition with the new one
   */
  loadComposition(
    url: string,
    app: string,
    overwrite?: boolean
  ): Promise<void> {
    return this.hsCompositionsParserService.loadUrl(url, app, overwrite);
  }

  /**
   * Parse and load composition from cookies
   * @param app - App identifier
   */
  async tryParseCompositionFromCookie(app: string): Promise<void> {
    if (
      localStorage.getItem('hs_layers') &&
      (<any>window).permalinkApp != true
    ) {
      await this.hsMapService.loaded(app);
      const data = localStorage.getItem('hs_layers');
      if (!data) {
        return;
      }
      const parsed = JSON.parse(data);
      if (parsed.expires && parsed.expires < new Date().getTime()) {
        return;
      }
      const layers = await this.hsCompositionsParserService.jsonToLayers(
        parsed,
        app
      );
      for (let i = 0; i < layers.length; i++) {
        this.hsMapService.addLayer(layers[i], app, DuplicateHandling.IgnoreNew);
      }
      localStorage.removeItem('hs_layers');
    }
  }

  /**
   * Parse and load composition from browser URL
   * @param app - App identifier
   */
  async tryParseCompositionFromUrlParam(app: string): Promise<void> {
    const configRef = this.hsConfig.get(app);
    let id =
      this.HsShareUrlService.getParamValue(HS_PRMS.composition) ||
      configRef.defaultComposition;
    if (id) {
      if (!id.includes('http') && !id.includes(configRef.status_manager_url)) {
        id = this.HsShareUrlService.endpointUrl(app) + '?request=load&id=' + id;
      }
      try {
        const defaultViewProperties = configRef.default_view?.getProperties();
        const compoParserServiceRef = this.hsCompositionsParserService.get(app);

        /**
         * Little bit tricky but solution to force affect default composition loading behavior. Used to prevent
         * passing params all the way down the loading pipeline
         */
        compoParserServiceRef.loadingOptions.suspendZoomingToExtent =
          defaultViewProperties?.hasOwnProperty('center') &&
          defaultViewProperties?.hasOwnProperty('zoom');
        compoParserServiceRef.loadingOptions.suspendPanelChange =
          configRef.sidebarClosed;

        await this.hsCompositionsParserService.loadUrl(id, app);
        compoParserServiceRef.loadingOptions.suspendZoomingToExtent = false;
      } catch (error) {
        this.get(app).compositionNotFoundAtUrl.next({error, app});
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
  translateString(module: string, text: string, app: string): string {
    return this.hsLanguageService.getTranslationIgnoreNonExisting(
      module,
      text,
      undefined,
      app
    );
  }
}
