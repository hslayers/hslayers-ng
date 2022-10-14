import {HttpClient} from '@angular/common/http';
import {Injectable, NgZone} from '@angular/core';
import {Location, PlatformLocation} from '@angular/common';

import {Subject, lastValueFrom, takeUntil} from 'rxjs';

import {HS_PRMS, HS_PRMS_BACKWARDS, HS_PRMS_REGENERATED} from './get-params';
import {HsConfig} from '../../config.service';
import {HsCoreService} from '../core/core.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLanguageService} from '../language/language.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsMapService} from '../map/map.service';
import {HsSaveMapService} from '../save-map/save-map.service';
import {HsUtilsService} from '../utils/utils.service';
import {MapComposition} from '../save-map/types/map-composition.type';
import {getShowInLayerManager, getTitle} from '../../common/layer-extensions';
import {transformExtent} from 'ol/proj';

export class HsShareUrlAppData {
  current_url = '';
  params = {};
  customParams = {};
  updateDebouncer = {};
  url_generation = true;
  //some of the code is taken from http://stackoverflow.com/questions/22258793/set-url-parameters-without-causing-page-refresh
  paramTimer = null;
  shareId = null;
  permalinkRequestUrl = '';
  id: any;
  urlUntilParams: string;
  param_string: string;
  statusSaving = false;
  data: MapComposition;
}

@Injectable({providedIn: 'root'})
export class HsShareUrlService {
  apps: {
    [id: string]: HsShareUrlAppData;
  } = {default: new HsShareUrlAppData()};

  private end = new Subject<void>();
  public browserUrlUpdated: Subject<{app: string; url: string}> = new Subject();

  constructor(
    public HsMapService: HsMapService,
    public HsCore: HsCoreService,
    public HsUtilsService: HsUtilsService,
    public HsSaveMapService: HsSaveMapService,
    public hsConfig: HsConfig,
    public HsLanguageService: HsLanguageService,
    public HsLayoutService: HsLayoutService,
    public HsEventBusService: HsEventBusService,
    private Location: Location,
    private zone: NgZone,
    private PlatformLocation: PlatformLocation,
    private HttpClient: HttpClient
  ) {}

  private keepTrackOfGetParams(app: string) {
    const appRef = this.get(app);
    const params = this.parse(location.search);
    /* We keep track of most hsl params separately so don't process 
    them here. Only third party params are interesting */
    for (const key of Object.keys(HS_PRMS_REGENERATED)) {
      delete params[HS_PRMS_REGENERATED[key]];
    }
    Object.assign(appRef.customParams, params);
  }

  /**
   * Get the params saved by the for the current app
   * @param app - App identifier
   */
  get(app: string): HsShareUrlAppData {
    if (this.apps[app ?? 'default'] == undefined) {
      this.apps[app ?? 'default'] = new HsShareUrlAppData();
    }
    return this.apps[app ?? 'default'];
  }

  /**
   * Get HSL server share service endpoint's url
   * @param app - App identifier
   */
  endpointUrl(app: string): string {
    let hostName = location.protocol + '//' + location.host;

    if (this.hsConfig.get(app).hostname?.status_manager?.url) {
      return this.hsConfig.get(app).hostname.status_manager.url;
    }
    if (this.hsConfig.get(app).hostname?.user?.url) {
      hostName = this.hsConfig.get(app).hostname.user.url;
    } else if (this.hsConfig.get(app).hostname?.default?.url) {
      hostName = this.hsConfig.get(app).hostname.default.url;
    }

    if (this.hsConfig.get(app).status_manager_url?.includes('://')) {
      //Full url specified
      return this.hsConfig.get(app).status_manager_url;
    } else {
      return (
        hostName + (this.hsConfig.get(app).status_manager_url || '/share/')
      );
    }
  }

  /**
   * Updates permalink composition. Used without data prop to update extent of the composition
   * @param app - App identifier
   * @param data - Map compositon data
   * @returns
   */
  async updatePermalinkComposition(
    app: string,
    data?: MapComposition
  ): Promise<any> {
    const appRef = this.get(app);
    const status_url = this.endpointUrl(app);
    const bbox = this.HsSaveMapService.getBboxFromObject(
      this.HsMapService.describeExtent(app)
    );
    appRef.data = data ?? {
      ...appRef.data,
      nativeExtent: transformExtent(
        bbox,
        'EPSG:4326',
        this.HsMapService.getCurrentProj(app)
      ),
      extent: bbox,
    };
    await lastValueFrom(
      this.HttpClient.post(
        status_url,
        JSON.stringify({
          data: appRef.data,
          permalink: true,
          id: appRef.id,
          project: this.hsConfig.get(app).project_name,
          request: 'save',
        })
      )
    );
    appRef.statusSaving = false;
    appRef.permalinkRequestUrl = status_url + '?request=load&id=' + appRef.id;
    this.update(app);
  }

  /**
   * Get actual map state information (visible layers, added layers*, active panel, map center and zoom level), create full Url link and push it in Url bar. (*Added layers are ommited from permalink url).
   */
  update(app: string): void {
    const appRef = this.get(app);
    const view = this.HsMapService.getMap(app).getView();
    appRef.id = this.HsUtilsService.generateUuid();

    const externalLayers = this.HsMapService.getLayersArray(app).filter(
      (lyr) => !(getShowInLayerManager(lyr) === false)
    );
    const visibleLayers = externalLayers
      .filter((lyr) => lyr.getVisible())
      .map((lyr) => getTitle(lyr));

    const addedLayers = externalLayers.filter(
      (lyr) => !this.hsConfig.get(app).default_layers?.includes(lyr)
    );
    //This might become useful, but url size is limited, so we are not using it
    const addedLayersJson = this.HsSaveMapService.layers2json(addedLayers, app);

    const pnlMain = this.HsLayoutService.get(app).mainpanel;
    this.push(
      HS_PRMS.panel,
      pnlMain == 'permalink' ? 'layermanager' : pnlMain,
      app
    );

    this.push(HS_PRMS.x, view.getCenter()[0], app);
    this.push(HS_PRMS.y, view.getCenter()[1], app);
    this.push(HS_PRMS.zoom, view.getZoom(), app);
    if (this.HsLanguageService.apps[app].language) {
      this.push(HS_PRMS.lang, this.HsLanguageService.apps[app].language, app);
    }
    this.push(HS_PRMS.visibleLayers, visibleLayers.join(';'), app);
    if (this.HsCore.puremapApp) {
      this.push(HS_PRMS.pureMap, 'true', app);
    }
    for (const [key, value] of Object.entries(appRef.customParams)) {
      if (key !== 'hs-permalink') {
        this.push(key, value, app);
      }
    }
    this.push('app', app, app); //Needs to be after customParams got from URL to overwrite app value
    if (appRef.statusSaving) {
      return;
    }
    this.HsUtilsService.debounce(
      () => {
        let locationPath = this.pathName();
        const paramsSerialized = Object.keys(appRef.params)
          .map((key) => {
            return {key, value: appRef.params[key]};
          })
          .map((dic) => `${dic.key}=${encodeURIComponent(dic.value)}`)
          .join('&');
        const baseHref = this.PlatformLocation.getBaseHrefFromDOM();
        if (
          locationPath.indexOf(baseHref) == 0 &&
          this.hsConfig.get(app).ngRouter
        ) {
          locationPath = locationPath.replace(baseHref, '');
        }
        if (Object.entries(this.hsConfig.apps).length == 1) {
          this.Location.replaceState(locationPath, paramsSerialized);
        }
        this.browserUrlUpdated.next({app, url: this.getPermalinkUrl(app)});
      },
      300,
      false,
      appRef.updateDebouncer
    )();
  }

  /**
   * @returns Permalink url
   * Create permalink Url to map
   */
  getPermalinkUrl(app: string): string {
    const appRef = this.get(app);
    if (this.HsCore.isMobile() && this.hsConfig.get(app).permalinkLocation) {
      //Deprecated? - isMobile??
      return (
        this.hsConfig.get(app).permalinkLocation.origin +
        appRef.current_url.replace(
          this.pathName(),
          this.hsConfig.get(app).permalinkLocation.pathname
        ) +
        `&${HS_PRMS.permalink}=${encodeURIComponent(
          appRef.permalinkRequestUrl
        )}`
      ).replace(
        this.pathName(),
        this.hsConfig.get(app).permalinkLocation.pathname
      );
    } else {
      return `${appRef.current_url}&${HS_PRMS.permalink}=${encodeURIComponent(
        appRef.permalinkRequestUrl
      )}`;
    }
  }

  private pathName(): string {
    let tmp = window.location.pathname.split('?')[0];
    if (!tmp.endsWith('/') && !tmp.split('/').pop().includes('.')) {
      tmp = tmp + '/';
    }
    return tmp;
  }

  /**
   * @returns Embedded url
   * Create Url for PureMap version of map
   */
  getPureMapUrl(app): string {
    const params: any = {puremap: 'true'};
    return (
      this.getPermalinkUrl(app) +
      '&' +
      this.HsUtilsService.paramsToURLWoEncode(params)
    );
  }

  /**
   * @param str Parameter string to parse
   * @returns Parsed parameter object
   * Parse parameter string from Url into key-value(s) pairs
   */
  parse(str: string) {
    if (typeof str != 'string') {
      return {};
    }

    str = str.trim().replace(/^\?/, '');

    if (!str) {
      return {};
    }

    return str
      .trim()
      .split('&')
      .reduce((paramDict, param) => {
        const parts = param.replace(/\+/g, ' ').split('=');
        let key = parts[0];
        let val = parts[1];

        key = decodeURIComponent(key);
        // missing `=` should be `null`:
        // http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters
        val = val == undefined ? null : decodeURIComponent(val);

        if (!paramDict.hasOwnProperty(key)) {
          paramDict[key] = val;
        } else if (Array.isArray(paramDict[key])) {
          paramDict[key].push(val);
        } else {
          paramDict[key] = [paramDict[key], val];
        }

        return paramDict;
      }, {});
  }

  /**
   * @param obj Parameter object to stringify
   * @returns Encoded parameter string or "" if no parameter object is given
   * Create encoded parameter string from parameter object
   */
  stringify(obj): string {
    if (!obj) {
      return '';
    }
    return Object.keys(obj)
      .map((key) => {
        const val = obj[key];

        if (Array.isArray(val)) {
          return val
            .map((val2) => {
              return encodeURIComponent(key) + '=' + encodeURIComponent(val2);
            })
            .join('&');
        }

        return encodeURIComponent(key) + '=' + encodeURIComponent(val);
      })
      .join('&');
  }

  /**
   * @param key Key name for pushed parameter
   * @param new_value Value for pushed parameter
   * Push new key-value pair into paramater object and update Url string with new params
   */
  push(key, new_value, app: string): void {
    const appRef = this.get(app);
    if (new_value === undefined) {
      delete appRef.params[key];
    } else {
      appRef.params[key] = new_value;
    }
    const new_params_string = this.stringify(appRef.params);
    appRef.param_string = new_params_string;
    appRef.urlUntilParams = location.origin + location.pathname;
    appRef.current_url = appRef.urlUntilParams + '?' + new_params_string;
  }

  /**
   * @param param - Param to get current value and remove
   * Returns param value and removes custom param when it is called
   */
  getParamValAndRemove(param: string, app: string): string {
    const appRef = this.get(app);
    const value = this.getParamValue(param);
    if (appRef.customParams[param]) {
      delete appRef.customParams[param];
    }
    return value;
  }

  /**
   * @param param Param to get current value
   * @returns Current value for requested param or null if param doesn't exist
   * Find current param value from Url
   */
  getParamValue(param: string): string {
    const tmp = this.parse(location.search);
    const key = Object.keys(HS_PRMS).find((k) => HS_PRMS[k] == param);
    if (tmp[param]) {
      return tmp[param];
    } else {
      if (tmp[param] == undefined && HS_PRMS_BACKWARDS[key] != undefined) {
        return this.getParamValue(HS_PRMS_BACKWARDS[key]);
      } else {
        return;
      }
    }
  }

  getParamValues(keys: string[]): any {
    const tmp = {};
    for (const key of keys) {
      tmp[key] = this.getParamValue(key);
    }
    return tmp;
  }

  /**
   * @param params A dictionary of custom parameters which get added to the generated url
   * Update values for custom parameters which get added to the url and usually are application specific
   */
  updateCustomParams(params, app): void {
    const appRef = this.get(app);
    for (const param in params) {
      appRef.customParams[param] = params[param];
    }
    if (appRef.paramTimer !== null) {
      clearTimeout(appRef.paramTimer);
    }
    appRef.paramTimer = setTimeout(() => {
      this.update(app);
    }, 1000);
  }

  /**
   * @param map Openlayers map
   */
  async init(app: string): Promise<void> {
    const appRef = this.get(app);
    this.keepTrackOfGetParams(app);
    await this.HsMapService.loaded(app);
    const map = this.HsMapService.getMap(app);
    if (appRef.url_generation) {
      //FIXME : always true
      let timer = null;
      this.HsEventBusService.mapExtentChanges
        .pipe(takeUntil(this.end))
        .subscribe(
          this.HsUtilsService.debounce(
            ({map, event, extent, app}) => {
              this.zone.run(() => {
                this.updatePermalinkComposition(app);
              });
            },
            200,
            false,
            this
          )
        );
      map.getLayers().on('add', (e) => {
        const layer = e.element;
        const external = getShowInLayerManager(layer);
        if (external !== null && external == false) {
          return;
        }
        layer.on('change:visible', (e) => {
          if (timer !== null) {
            clearTimeout(timer);
          }
          timer = setTimeout(() => {
            if (!this.end.closed) {
              this.update(app);
            }
          }, 1000);
        });
      });
      const lang = this.getParamValue(HS_PRMS.lang);
      if (lang) {
        this.HsLanguageService.setLanguage(lang, app);
      }
      const view = this.getParamValue(HS_PRMS.view);
      // this.HsMapService.visible = !(view == '3d');
    }
  }
}
