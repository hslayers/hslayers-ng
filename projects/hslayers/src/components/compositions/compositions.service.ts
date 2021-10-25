import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Injectable} from '@angular/core';

import Feature from 'ol/Feature';
import {Geometry} from 'ol/geom';
import {Observable, Subject} from 'rxjs';

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
import {HsShareUrlService} from '../permalink/share-url.service';
import {HsStatusManagerService} from '../save-map/status-manager.service';
import {HsUtilsService} from '../utils/utils.service';

@Injectable({
  providedIn: 'root',
})
export class HsCompositionsService {
  data: any = {};
  compositionToLoad: {url: string; title: string};
  notSavedCompositionLoading: Subject<string> = new Subject();
  compositionNotFoundAtUrl: Subject<any> = new Subject();
  shareId: string;
  constructor(
    private http: HttpClient,
    public hsMapService: HsMapService,
    public hsCore: HsCoreService,
    public hsCompositionsParserService: HsCompositionsParserService,
    public hsConfig: HsConfig,
    public hsPermalinkUrlService: HsShareUrlService,
    public hsUtilsService: HsUtilsService,
    public hsStatusManagerService: HsStatusManagerService,
    public hsCompositionsMickaService: HsCompositionsMickaService,
    public hsCompositionsStatusManagerMickaJointService: HsCompositionsStatusManagerMickaJointService,
    public hsCompositionsLaymanService: HsCompositionsLaymanService,
    public hsLanguageService: HsLanguageService,
    public $log: HsLogService,
    public hsCommonEndpointsService: HsCommonEndpointsService,
    public hsCompositionsMapService: HsCompositionsMapService,
    public hsEventBusService: HsEventBusService
  ) {
    if (hsConfig.saveMapStateOnReload) {
      //Load composition data from cookies only if it is anticipated
      setTimeout(() => {
        this.tryParseCompositionFromCookie();
      }, 500);
    }

    this.tryParseCompositionFromUrlParam();
    this.parsePermalinkLayers();

    this.hsEventBusService.mapResets.subscribe(() => {
      this.hsCompositionsParserService.composition_loaded = null;
      this.hsCompositionsParserService.composition_edited = false;
    });

    this.hsEventBusService.compositionEdits.subscribe(() => {
      this.hsCompositionsParserService.composition_edited = true;
    });

    this.hsEventBusService.compositionLoadStarts.subscribe((id) => {
      id = `${this.hsStatusManagerService.endpointUrl()}?request=load&id=${id}`;
      this.hsCompositionsParserService.loadUrl(id);
    });

    this.hsEventBusService.vectorQueryFeatureSelection.subscribe((e) => {
      for (const endpoint of this.hsCommonEndpointsService.endpoints) {
        const record =
          this.hsCompositionsMapService.getFeatureRecordAndUnhighlight(
            e.feature,
            e.selector,
            endpoint.compositions
          );
        if (record) {
          this.loadComposition(this.getRecordLink(record));
        }
      }
    });
  }

  loadCompositions(ds: HsEndpoint, params): Observable<any> {
    this.hsCompositionsMapService.clearExtentLayer();
    const bbox = this.hsMapService.getMapExtentInEpsg4326();
    const Observable = this.managerByType(ds).loadList(
      ds,
      params,
      (feature: Feature<Geometry>) =>
        this.hsCompositionsMapService.addExtentFeature(feature),
      bbox
    );
    return Observable;
  }

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

  managerByType(endpoint): any {
    switch (endpoint.type) {
      case 'micka':
        return this.hsCompositionsStatusManagerMickaJointService;
      case 'layman':
        return this.hsCompositionsLaymanService;
      default:
        this.$log.warn(`Endpoint type '${endpoint.type} not supported`);
    }
  }

  deleteComposition(composition): void {
    this.managerByType(composition.endpoint)?.delete(
      composition.endpoint,
      composition
    );
  }

  async shareComposition(record): Promise<any> {
    const recordLink = encodeURIComponent(this.getRecordLink(record));
    const permalinkOverride = this.hsConfig.permalinkLocation;
    const compositionUrl =
      this.hsCore.isMobile() && permalinkOverride
        ? permalinkOverride.origin + permalinkOverride.pathname
        : `${location.origin}${location.pathname}?composition=${recordLink}`;
    this.shareId = this.hsUtilsService.generateUuid();
    const headers = new HttpHeaders().set(
      'Content-Type',
      'text/plain; charset=utf-8'
    );
    return await this.http
      .post(
        this.hsStatusManagerService.endpointUrl(),
        JSON.stringify({
          request: 'socialShare',
          id: this.shareId,
          url: encodeURIComponent(compositionUrl),
          title: record.title,
          description: record.abstract,
          image: record.thumbnail || 'https://ng.hslayers.org/img/logo.png',
        }),
        {headers, responseType: 'text'}
      )
      .toPromise();
  }
  async getShareUrl(): Promise<string> {
    try {
      return await this.hsUtilsService.shortUrl(
        this.hsStatusManagerService.endpointUrl() +
          '?request=socialshare&id=' +
          this.shareId
      );
    } catch (ex) {
      this.$log.log('Error creating short URL');
    }
  }
  async getCompositionInfo(composition): Promise<any> {
    const info = await this.managerByType(composition.endpoint).getInfo(
      composition
    );
    this.data.info = info;
    return info;
  }

  getRecordLink(record): string {
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

  loadCompositionParser(record): Promise<void> {
    const recordEndpoint = record.endpoint;
    return new Promise((resolve, reject) => {
      let url;
      switch (recordEndpoint.type) {
        case 'micka':
          url = this.getRecordLink(record);
          break;
        case 'layman':
          url = record.url + '/file';
          break;
        default:
          this.$log.warn(`Endpoint type '${recordEndpoint.type} not supported`);
          reject();
          return;
      }
      if (url) {
        //Provide save-map comoData workspace property and distinguish between editable and non-editable compositions
        this.hsCompositionsParserService.current_composition_workspace =
          record.editable ? record.workspace : null;
        if (this.hsCompositionsParserService.composition_edited == true) {
          this.notSavedCompositionLoading.next(url);
          reject();
        } else {
          this.loadComposition(url, true).then(() => {
            resolve();
          });
        }
      }
    });
  }

  /**
   * Load layers received through permalink to map
   */
  async parsePermalinkLayers(): Promise<void> {
    await this.hsMapService.loaded();
    const permalink = this.hsPermalinkUrlService.getParamValue(
      HS_PRMS.permalink
    );
    if (!permalink) {
      return;
    }
    const layersUrl = this.hsUtilsService.proxify(permalink);
    const response: any = await this.http.get(layersUrl).toPromise();
    if (response.success == true) {
      const data: any = {};
      data.data = {};
      if (response.data.layers) {
        data.data.layers = response.data.layers;
      } else {
        //Some old structure, where layers are stored in data
        data.data.layers = response.data;
      }
      this.hsCompositionsParserService.removeCompositionLayers();
      const layers = await this.hsCompositionsParserService.jsonToLayers(data);
      for (let i = 0; i < layers.length; i++) {
        this.hsMapService.addLayer(layers[i], DuplicateHandling.RemoveOriginal);
      }
    } else {
      this.$log.log('Error loading permalink layers');
    }
  }

  loadComposition(url, overwrite?: boolean): Promise<void> {
    return this.hsCompositionsParserService.loadUrl(url, overwrite);
  }

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
      const layers = await this.hsCompositionsParserService.jsonToLayers(
        parsed
      );
      for (let i = 0; i < layers.length; i++) {
        this.hsMapService.addLayer(layers[i], DuplicateHandling.IgnoreNew);
      }
      localStorage.removeItem('hs_layers');
    }
  }

  async tryParseCompositionFromUrlParam(): Promise<void> {
    let id = this.hsPermalinkUrlService.getParamValue(HS_PRMS.composition);
    if (id) {
      if (
        !id.includes('http') &&
        !id.includes(this.hsConfig.status_manager_url)
      ) {
        id =
          this.hsStatusManagerService.endpointUrl() + '?request=load&id=' + id;
      }
      try {
        await this.hsCompositionsParserService.loadUrl(id);
      } catch (e) {
        this.compositionNotFoundAtUrl.next(e);
        this.$log.warn(e);
      }
    }
  }
  commonId(composition): string {
    if (composition === undefined) {
      return '';
    }
    return composition.uuid || composition.id;
  }

  translateString(module: string, text: string): string {
    return this.hsLanguageService.getTranslationIgnoreNonExisting(module, text);
  }
}
