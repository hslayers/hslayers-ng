import {DestroyRef, Injectable, NgZone, inject} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Location, PlatformLocation} from '@angular/common';
import {Subject, debounceTime, fromEvent, lastValueFrom} from 'rxjs';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

import {transformExtent} from 'ol/proj';

import {HS_PRMS, HS_PRMS_BACKWARDS, HS_PRMS_REGENERATED} from './get-params';
import {HsConfig} from 'hslayers-ng/config';
import {HsEventBusService} from 'hslayers-ng/services/event-bus';
import {HsLanguageService} from 'hslayers-ng/services/language';
import {HsLayoutService} from 'hslayers-ng/services/layout';
import {HsMapService} from 'hslayers-ng/services/map';
import {HsUtilsService} from 'hslayers-ng/services/utils';
import {MapComposition} from 'hslayers-ng/types';
import {getShowInLayerManager, getTitle} from 'hslayers-ng/common/extensions';

@Injectable({providedIn: 'root'})
export class HsShareUrlService {
  current_url = '';
  params = {};
  customParams = {};
  updateDebouncer = {};
  url_generation = true; //FIXME: - but needs to be configurable or smth
  //some of the code is taken from http://stackoverflow.com/questions/22258793/set-url-parameters-without-causing-page-refresh
  paramTimer = null;
  shareId = null;
  permalinkRequestUrl = '';
  id: any;
  urlUntilParams: string;
  param_string: string;
  statusSaving = false;
  data: MapComposition;

  public browserUrlUpdated: Subject<string> = new Subject();
  private destroyRef = inject(DestroyRef);

  constructor(
    public hsMapService: HsMapService,
    public HsUtilsService: HsUtilsService,
    public hsConfig: HsConfig,
    public HsLanguageService: HsLanguageService,
    public HsLayoutService: HsLayoutService,
    public HsEventBusService: HsEventBusService,
    private Location: Location,
    private zone: NgZone,
    private PlatformLocation: PlatformLocation,
    private HttpClient: HttpClient,
  ) {
    this.keepTrackOfGetParams();
    this.hsMapService.loaded().then((map) => {
      if (this.url_generation) {
        //FIXME : always true
        this.HsEventBusService.mapExtentChanges
          .pipe(debounceTime(200), takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.zone.run(() => {
                if (this.HsLayoutService.mainpanel == 'share') {
                  this.updatePermalinkComposition();
                } else {
                  this.updateViewParamsInUrl(true);
                }
              });
            },
          });

        map.getLayers().on('add', (e) => {
          const layer = e.element;
          const external = getShowInLayerManager(layer);
          if (external !== null && external == false) {
            return;
          }
          fromEvent(layer, 'change:visible')
            .pipe(debounceTime(1000))
            .subscribe({
              next: () => {
                this.update();
              },
            });
        });

        const lang = this.getParamValue(HS_PRMS.lang);
        if (lang && !this.HsLanguageService.langFromCMS) {
          this.HsLanguageService.setLanguage(lang);
        }
        const view = this.getParamValue(HS_PRMS.view);
        // this.hsMapService.visible = !(view == '3d');
      }

      this.panToUrlCoords();
    });
  }

  /**
   * Update map view with values from URL
   */
  private panToUrlCoords() {
    const pos = this.getParamValues([HS_PRMS.x, HS_PRMS.y, HS_PRMS.zoom]);
    if (!Object.keys(pos).some((k) => pos[k] == undefined || pos[k] == 'NaN')) {
      this.hsMapService.moveToAndZoom(
        parseFloat(pos[HS_PRMS.x]),
        parseFloat(pos[HS_PRMS.y]),
        parseInt(pos[HS_PRMS.zoom]),
      );
    }
  }

  private keepTrackOfGetParams() {
    const params = this.parse(location.search);
    /* We keep track of most hsl params separately so don't process 
    them here. Only third party params are interesting */
    for (const key of Object.keys(HS_PRMS_REGENERATED)) {
      delete params[HS_PRMS_REGENERATED[key]];
    }
    Object.assign(this.customParams, params);
  }

  /**
   * Get HSL server share service endpoint's url
   */
  endpointUrl(): string {
    let hostName = location.protocol + '//' + location.host;

    if (this.hsConfig.hostname?.shareService?.url) {
      return this.hsConfig.hostname.shareService.url;
    }
    if (this.hsConfig.hostname?.user?.url) {
      hostName = this.hsConfig.hostname.user.url;
    } else if (this.hsConfig.hostname?.default?.url) {
      hostName = this.hsConfig.hostname.default.url;
    }

    if (this.hsConfig.shareServiceUrl?.includes('://')) {
      //Full url specified
      return this.hsConfig.shareServiceUrl;
    }
    return hostName + (this.hsConfig.shareServiceUrl || '/share/');
  }

  /**
   * Updates permalink composition. Used without data prop to update extent of the composition
   * @param data - Map composition data
   */
  async updatePermalinkComposition(data?: MapComposition): Promise<any> {
    const status_url = this.endpointUrl();
    const bbox = this.HsUtilsService.getBboxFromObject(
      this.hsMapService.describeExtent(),
    );
    this.data = data ?? {
      ...this.data,
      nativeExtent: transformExtent(
        bbox,
        'EPSG:4326',
        this.hsMapService.getCurrentProj(),
      ),
      extent: bbox,
    };
    await lastValueFrom(
      this.HttpClient.post(
        status_url,
        JSON.stringify({
          data: this.data,
          permalink: true,
          id: this.id,
          project: this.hsConfig.project_name,
          request: 'save',
        }),
      ),
    );
    this.statusSaving = false;
    this.permalinkRequestUrl = status_url + '?request=load&id=' + this.id;
    this.update();
  }

  /**
   * Get actual map state information (visible layers, added layers*, active panel, map center and zoom level), create full Url link and push it in Url bar. (*Added layers are omitted from permalink url).
   */
  update(): void {
    this.id = this.HsUtilsService.generateUuid();

    const externalLayers = this.hsMapService
      .getLayersArray()
      .filter((lyr) => !(getShowInLayerManager(lyr) === false));
    const visibleLayers = externalLayers
      .filter((lyr) => lyr.getVisible())
      .map((lyr) => getTitle(lyr));

    this.updateViewParamsInUrl();
    //This might become useful, but url size is limited, so we are not using it
    // const addedLayers = externalLayers.filter(
    //   (lyr) => !this.hsConfig.default_layers?.includes(lyr),
    // );
    // const addedLayersJson = this.HsSaveMapService.layers2json(addedLayers);

    const pnlMain = this.HsLayoutService.mainpanel;
    this.push(HS_PRMS.panel, pnlMain == 'share' ? 'layerManager' : pnlMain);

    if (this.HsLanguageService.language) {
      this.push(HS_PRMS.lang, this.HsLanguageService.language);
    }
    this.push(HS_PRMS.visibleLayers, visibleLayers.join(';'));
    if (this.HsLayoutService.puremapApp) {
      this.push(HS_PRMS.pureMap, 'true');
    }
    for (const [key, value] of Object.entries(this.customParams)) {
      if (key !== 'hs-permalink') {
        this.push(key, value);
      }
    }
    if (this.hsConfig.id) {
      this.push('app', this.hsConfig.id); //Needs to be after customParams got from URL to overwrite app value
    }
    if (this.statusSaving) {
      return;
    }
    this.updateURL();
  }

  /**
   * Update URL params when single HSL app is bootstrapped
   */
  private updateURL() {
    this.HsUtilsService.debounce(
      () => {
        //No updates for multi-apps
        if (document.querySelectorAll('hslayers-app').length == 1) {
          let locationPath = this.pathName();
          const paramsSerialized = Object.keys(this.params)
            .map((key) => {
              return {key, value: this.params[key]};
            })
            .map((dic) => `${dic.key}=${encodeURIComponent(dic.value)}`)
            .join('&');
          const baseHref = this.PlatformLocation.getBaseHrefFromDOM();
          if (locationPath.startsWith(baseHref)) {
            locationPath = locationPath.substring(baseHref.length);
          }
          this.Location.replaceState(locationPath, paramsSerialized);
          this.browserUrlUpdated.next(this.getPermalinkUrl());
        }
      },
      300,
      false,
      this.updateDebouncer,
    )();
  }

  /**
   * Updates URL params related to map view
   * @param standalone - True if called outside of 'update'
   */
  private updateViewParamsInUrl(standalone = false): void {
    const view = this.hsMapService.getMap().getView();
    this.push(HS_PRMS.x, view.getCenter()[0]);
    this.push(HS_PRMS.y, view.getCenter()[1]);
    this.push(HS_PRMS.zoom, view.getZoom());
    standalone && this.updateURL();
  }

  /**
   * Create permalink URL to map
   * @returns Permalink URL
   */
  getPermalinkUrl(): string {
    if (this.hsConfig.permalinkLocation) {
      return (
        this.hsConfig.permalinkLocation.origin +
        this.current_url.replace(
          this.pathName(),
          this.hsConfig.permalinkLocation.pathname,
        ) +
        `&${HS_PRMS.permalink}=${encodeURIComponent(this.permalinkRequestUrl)}`
      ).replace(this.pathName(), this.hsConfig.permalinkLocation.pathname);
    }
    return `${this.current_url}&${HS_PRMS.permalink}=${encodeURIComponent(
      this.permalinkRequestUrl,
    )}`;
  }

  private pathName(): string {
    let tmp = window.location.pathname.split('?')[0];
    if (!tmp.endsWith('/') && !tmp.split('/').pop().includes('.')) {
      tmp = tmp + '/';
    }
    return tmp;
  }

  /**
   * Create URL for PureMap version of map
   * @returns Embedded URL
   */
  getPureMapUrl(): string {
    const params = {};
    params[HS_PRMS.pureMap] = true;
    return (
      this.getPermalinkUrl() +
      '&' +
      this.HsUtilsService.paramsToURLWoEncode(params)
    );
  }

  /**
   * Parse parameter string from URL into key-value(s) pairs
   * @param str - Parameter string to parse
   * @returns Parsed parameter object
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
   * Create encoded parameter string from parameter object
   * @param obj - Parameter object to stringify
   * @returns Encoded parameter string or "" if no parameter object is given
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
   * Push new key-value pair into parameter object and update Url string with new params
   * @param key - Key name for pushed parameter
   * @param new_value - Value for pushed parameter
   */
  push(key, new_value): void {
    if (new_value === undefined) {
      delete this.params[key];
    } else {
      this.params[key] = new_value;
    }
    const new_params_string = this.stringify(this.params);
    this.param_string = new_params_string;
    this.urlUntilParams = location.origin + location.pathname;
    this.current_url = this.urlUntilParams + '?' + new_params_string;
  }

  /**
   * Returns param value and removes custom param when it is called
   * @param param - Param to get current value and remove
   */
  getParamValAndRemove(param: string): string {
    const value = this.getParamValue(param);
    if (this.customParams[param]) {
      delete this.customParams[param];
    }
    return value;
  }

  /**
   * Find current param value from URL
   * @param param - Param to get current value
   * @returns Current value for requested param or null if param doesn't exist
   */
  getParamValue(param: string): string {
    const tmp = this.parse(location.search);
    const key = Object.keys(HS_PRMS).find((k) => HS_PRMS[k] == param);
    if (tmp[param]) {
      return tmp[param];
    }
    if (tmp[param] == undefined && HS_PRMS_BACKWARDS[key] != undefined) {
      return this.getParamValue(HS_PRMS_BACKWARDS[key]);
    }
    return;
  }

  getParamValues(keys: string[]): any {
    const tmp = {};
    for (const key of keys) {
      tmp[key] = this.getParamValue(key);
    }
    return tmp;
  }

  /**
   * Update values for custom parameters which get added to the url and usually are application specific
   * @param params - A dictionary of custom parameters which get added to the generated URL
   */
  updateCustomParams(params): void {
    for (const param in params) {
      this.customParams[param] = params[param];
    }
    if (this.paramTimer !== null) {
      clearTimeout(this.paramTimer);
    }
    this.paramTimer = setTimeout(() => {
      this.update();
    }, 1000);
  }
}
