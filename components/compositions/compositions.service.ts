import {HsCommonEndpointsService} from '../../common/endpoints/endpoints.service';
import {HsCompositionsLaymanService} from './endpoints/compositions-layman.service';
import {HsCompositionsMapService} from './compositions-map.service';
import {HsCompositionsMickaService} from './endpoints/compositions-micka.service';
import {HsCompositionsParserService} from './compositions-parser.service';
import {HsCompositionsStatusManagerMickaJointService} from './endpoints/status-manager-micka-joint.service';
import {HsConfig} from '../../config.service';
import {HsCoreService} from '../core/core.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLogService} from '../../common/log/log.service';
import {HsMapService} from '../map/map.service';
import {HsShareUrlService} from '../permalink/share-url.service';
import {HsStatusManagerService} from '../save-map/status-manager.service';
import {HsUtilsService} from '../utils/utils.service';
import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class HsCompositionsService {
  data: any = {};
  compositionToLoad: {url: string; title: string};
  notSavedCompositionLoading: Subject<string> = new Subject();
  constructor(
    $location,
    private http: HttpClient,
    private HsMapService: HsMapService,
    private HsCore: HsCoreService,
    private HsCompositionsParserService: HsCompositionsParserService,
    private HsConfig: HsConfig,
    private HsPermalinkUrlService: HsShareUrlService,
    private HsUtilsService: HsUtilsService,
    private HsStatusManagerService: HsStatusManagerService,
    private HsCompositionsMickaService: HsCompositionsMickaService,
    private HsCompositionsStatusManagerMickaJointService: HsCompositionsStatusManagerMickaJointService,
    private HsCompositionsLaymanService: HsCompositionsLaymanService,
    private $log: HsLogService,
    private $window: Window,
    private HsCommonEndpointsService: HsCommonEndpointsService,
    private HsCompositionsMapService: HsCompositionsMapService,
    private HsEventBusService: HsEventBusService
  ) {
    this.tryParseCompositionFromCookie();
    this.tryParseCompositionFromUrlParam();
    if (HsPermalinkUrlService.getParamValue('permalink')) {
      this.parsePermalinkLayers();
    }

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
      const record = this.HsCompositionsMapService.getFeatureRecordAndUnhighlight(
        e.feature,
        e.selector
      );
      if (record) {
        this.loadComposition(this.getRecordLink(record));
      }
    });
  }

  datasetSelect(id_selected) {
    this.data.id_selected = id_selected;
  }

  async loadCompositions(ds, params) {
    this.HsCompositionsMapService.clearExtentLayer();
    const bbox = this.HsMapService.getMapExtentInEpsg4326();
    await this.managerByType(ds).loadList(
      ds,
      params,
      bbox,
      this.HsCompositionsMapService.extentLayer
    );
  }

  resetCompositionCounter() {
    this.HsCommonEndpointsService.endpoints.forEach((ds) => {
      if (ds.type == 'micka') {
        this.HsCompositionsMickaService.resetCompositionCounter(ds);
      }
    });
  }

  managerByType(endpoint) {
    switch (endpoint.type) {
      case 'micka':
        return this.HsCompositionsStatusManagerMickaJointService;
      case 'layman':
        return this.HsCompositionsLaymanService;
      default:
        this.$log.warn(`Endpoint type '${endpoint.type} not supported`);
    }
  }

  deleteComposition(composition) {
    const endpoint = composition.endpoint;
    this.managerByType(endpoint).delete(endpoint, composition);
  }

  async shareComposition(record) {
    const recordLink = encodeURIComponent(this.getRecordLink(record));
    const permalinkOverride = this.HsConfig.permalinkLocation;
    const compositionUrl =
      this.HsCore.isMobile() && permalinkOverride
        ? permalinkOverride.origin + permalinkOverride.pathname
        : `${location.origin}${location.pathname}?composition=${recordLink}`;
    const shareId = this.HsUtilsService.generateUuid();
    const response: any = await this.http
      .post(
        this.HsStatusManagerService.endpointUrl(),
        JSON.stringify({
          request: 'socialShare',
          id: shareId,
          url: encodeURIComponent(compositionUrl),
          title: record.title,
          description: record.abstract,
          image: record.thumbnail || 'https://ng.hslayers.org/img/logo.jpg',
        })
      )
      .toPromise();

    this.HsUtilsService.shortUrl(
      this.HsStatusManagerService.endpointUrl() +
        '?request=socialshare&id=' +
        shareId
    )
      .then((shortUrl) => {
        this.data.shareUrl = shortUrl;
      })
      .catch(() => {
        this.$log.log('Error creating short Url');
      });
    this.data.shareTitle = record.title;
    if (
      this.HsConfig.social_hashtag &&
      this.data.shareTitle.indexOf(this.HsConfig.social_hashtag) <= 0
    ) {
      this.data.shareTitle += ' ' + this.HsConfig.social_hashtag;
    }

    this.data.shareDescription = record.abstract;
  }

  getCompositionInfo(composition, cb) {
    this.managerByType(composition.endpoint)
      .getInfo(composition)
      .then((info) => {
        this.data.info = info;
        cb(info);
      });
  }

  getRecordLink(record) {
    let url;
    if (record.link !== undefined) {
      url = record.link;
    } else if (record.links !== undefined) {
      url = record.links.filter((l) => l.url.indexOf('/file') > -1)[0].url;
    }
    return url;
  }

  loadCompositionParser(record) {
    return new Promise((resolve, reject) => {
      let url;
      switch (record.endpoint.type) {
        case 'micka':
          url = this.getRecordLink(record);
          break;
        case 'layman':
          url =
            record.url.replace('http://', location.protocol + '://') + '/file';
          break;
        default:
          this.$log.warn(
            `Endpoint type '${record.endpoint.type} not supported`
          );
      }
      if (this.HsCompositionsParserService.composition_edited == true) {
        this.notSavedCompositionLoading.next(url);
        reject();
      } else {
        this.loadComposition(url, true).then(() => {
          resolve();
        });
      }
    });
  }

  /**
   * @function parsePermalinkLayers
   * @memberof HsCompositionsService
   * Load layers received through permalink to map
   */
  async parsePermalinkLayers() {
    await this.HsMapService.loaded();
    const layersUrl = this.HsUtilsService.proxify(
      this.HsPermalinkUrlService.getParamValue('permalink')
    );
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
      const layers = this.HsCompositionsParserService.jsonToLayers(data);
      for (let i = 0; i < layers.length; i++) {
        this.HsMapService.addLayer(layers[i], true);
      }
    } else {
      if (console) {
        this.$log.log('Error loading permalink layers');
      }
    }
  }

  loadComposition(url, overwrite) {
    return this.HsCompositionsParserService.loadUrl(url, overwrite);
  }

  /**
   *
   */
  async tryParseCompositionFromCookie() {
    if (localStorage.getItem('hs_layers') && $window.permalinkApp != true) {
      await this.HsMapService.loaded();
      const data = localStorage.getItem('hs_layers');
      if (!data) {
        return;
      }
      const layers = this.HsCompositionsParserService.jsonToLayers(
        JSON.parse(data)
      );
      for (let i = 0; i < layers.length; i++) {
        this.HsMapService.addLayer(layers[i], false);
      }
      localStorage.removeItem('hs_layers');
    }
  }

  /**
   *
   */
  tryParseCompositionFromUrlParam() {
    if (this.HsPermalinkUrlService.getParamValue('composition')) {
      let id = this.HsPermalinkUrlService.getParamValue('composition');
      if (
        id.indexOf('http') == -1 &&
        id.indexOf(this.HsConfig.status_manager_url) == -1
      ) {
        id =
          this.HsStatusManagerService.endpointUrl() + '?request=load&id=' + id;
      }
      this.HsCompositionsParserService.loadUrl(id);
    }
  }
}
