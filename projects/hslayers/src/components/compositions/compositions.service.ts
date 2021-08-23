import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Injectable} from '@angular/core';
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
    public HsMapService: HsMapService,
    public HsCore: HsCoreService,
    public HsCompositionsParserService: HsCompositionsParserService,
    public HsConfig: HsConfig,
    public HsPermalinkUrlService: HsShareUrlService,
    public HsUtilsService: HsUtilsService,
    public HsStatusManagerService: HsStatusManagerService,
    public HsCompositionsMickaService: HsCompositionsMickaService,
    public HsCompositionsStatusManagerMickaJointService: HsCompositionsStatusManagerMickaJointService,
    public HsCompositionsLaymanService: HsCompositionsLaymanService,
    public HsLanguageService: HsLanguageService,
    public $log: HsLogService,
    public HsCommonEndpointsService: HsCommonEndpointsService,
    public HsCompositionsMapService: HsCompositionsMapService,
    public HsEventBusService: HsEventBusService
  ) {
    if (HsConfig.saveMapStateOnReload) {
      //Load composition data from cookies only if it is anticipated
      setTimeout(() => {
        this.tryParseCompositionFromCookie();
      }, 500);
    }

    this.tryParseCompositionFromUrlParam();
    this.parsePermalinkLayers();

    this.HsEventBusService.mapResets.subscribe(() => {
      this.HsCompositionsParserService.composition_loaded = null;
      this.HsCompositionsParserService.composition_edited = false;
    });

    this.HsEventBusService.compositionEdits.subscribe(() => {
      this.HsCompositionsParserService.composition_edited = true;
    });

    this.HsEventBusService.compositionLoadStarts.subscribe((id) => {
      id = `${this.HsStatusManagerService.endpointUrl()}?request=load&id=${id}`;
      this.HsCompositionsParserService.loadUrl(id);
    });

    this.HsEventBusService.vectorQueryFeatureSelection.subscribe((e) => {
      const record =
        this.HsCompositionsMapService.getFeatureRecordAndUnhighlight(
          e.feature,
          e.selector
        );
      if (record) {
        this.loadComposition(this.getRecordLink(record));
      }
    });
  }

  loadCompositions(ds: HsEndpoint, params): Observable<any> {
    this.HsCompositionsMapService.clearExtentLayer();
    const bbox = this.HsMapService.getMapExtentInEpsg4326();
    const Observable = this.managerByType(ds).loadList(ds, params, bbox);
    return Observable;
  }

  resetCompositionCounter(): void {
    this.HsCommonEndpointsService.endpoints.forEach((ep) => {
      switch (ep.type) {
        case 'micka':
          return this.HsCompositionsMickaService.resetCompositionCounter(ep);
        case 'layman':
          return this.HsCompositionsLaymanService.resetCompositionCounter(ep);
        default:
          this.$log.warn(`Endpoint type '${ep.type} not supported`);
      }
    });
  }

  managerByType(endpoint): any {
    switch (endpoint.type) {
      case 'micka':
        return this.HsCompositionsStatusManagerMickaJointService;
      case 'layman':
        return this.HsCompositionsLaymanService;
      default:
        this.$log.warn(`Endpoint type '${endpoint.type} not supported`);
    }
  }

  deleteComposition(composition): void {
    const endpoint = composition.endpoint;
    this.managerByType(endpoint)?.delete(endpoint, composition);
  }

  async shareComposition(record): Promise<any> {
    const recordLink = encodeURIComponent(this.getRecordLink(record));
    const permalinkOverride = this.HsConfig.permalinkLocation;
    const compositionUrl =
      this.HsCore.isMobile() && permalinkOverride
        ? permalinkOverride.origin + permalinkOverride.pathname
        : `${location.origin}${location.pathname}?composition=${recordLink}`;
    this.shareId = this.HsUtilsService.generateUuid();
    const headers = new HttpHeaders().set(
      'Content-Type',
      'text/plain; charset=utf-8'
    );
    return await this.http
      .post(
        this.HsStatusManagerService.endpointUrl(),
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
      return await this.HsUtilsService.shortUrl(
        this.HsStatusManagerService.endpointUrl() +
          '?request=socialshare&id=' +
          this.shareId
      );
    } catch (ex) {
      this.$log.log('Error creating short Url');
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
      if (record?.endpoint?.type == 'layman') {
        url = record.url + '/file' + '?timestamp=' + Date.now();
      }
      return url;
    } catch (e) {
      this.$log.warn(e);
    }
  }

  loadCompositionParser(record): Promise<void> {
    return new Promise((resolve, reject) => {
      let url;
      switch (record.endpoint.type) {
        case 'micka':
          url = this.getRecordLink(record);
          break;
        case 'layman':
          url = record.url + '/file';
          break;
        default:
          this.$log.warn(
            `Endpoint type '${record.endpoint.type} not supported`
          );
          reject();
          return;
      }
      if (url) {
        //Provide save-map comoData workspace property and distinguish between editable and non-editable compositions
        this.HsCompositionsParserService.current_composition_workspace =
          record.editable ? record.workspace : null;
        if (this.HsCompositionsParserService.composition_edited == true) {
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
    await this.HsMapService.loaded();
    const permalink = this.HsPermalinkUrlService.getParamValue(
      HS_PRMS.permalink
    );
    if (!permalink) {
      return;
    }
    const layersUrl = this.HsUtilsService.proxify(permalink);
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
      this.HsCompositionsParserService.removeCompositionLayers();
      const layers = await this.HsCompositionsParserService.jsonToLayers(data);
      for (let i = 0; i < layers.length; i++) {
        this.HsMapService.addLayer(layers[i], DuplicateHandling.RemoveOriginal);
      }
    } else {
      this.$log.log('Error loading permalink layers');
    }
  }

  loadComposition(url, overwrite?: boolean): Promise<void> {
    return this.HsCompositionsParserService.loadUrl(url, overwrite);
  }

  async tryParseCompositionFromCookie(): Promise<void> {
    if (
      localStorage.getItem('hs_layers') &&
      (<any>window).permalinkApp != true
    ) {
      await this.HsMapService.loaded();
      const data = localStorage.getItem('hs_layers');
      if (!data) {
        return;
      }
      const parsed = JSON.parse(data);
      if (parsed.expires && parsed.expires < new Date().getTime()) {
        return;
      }
      const layers = await this.HsCompositionsParserService.jsonToLayers(
        parsed
      );
      for (let i = 0; i < layers.length; i++) {
        this.HsMapService.addLayer(layers[i], DuplicateHandling.IgnoreNew);
      }
      localStorage.removeItem('hs_layers');
    }
  }

  async tryParseCompositionFromUrlParam(): Promise<void> {
    let id = this.HsPermalinkUrlService.getParamValue(HS_PRMS.composition);
    if (id) {
      if (
        !id.includes('http') &&
        !id.includes(this.HsConfig.status_manager_url)
      ) {
        id =
          this.HsStatusManagerService.endpointUrl() + '?request=load&id=' + id;
      }
      try {
        await this.HsCompositionsParserService.loadUrl(id);
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
    return this.HsLanguageService.getTranslationIgnoreNonExisting(module, text);
  }
}
