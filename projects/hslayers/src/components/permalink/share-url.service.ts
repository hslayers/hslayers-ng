import {Injectable, NgZone} from '@angular/core';
import {Location, PlatformLocation} from '@angular/common';

import {Map} from 'ol';
import {Subject} from 'rxjs';

import {HsConfig} from '../../config.service';
import {HsCoreService} from '../core/core.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLanguageService} from '../language/language.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsMapService} from '../map/map.service';
import {HsSaveMapService} from '../save-map/save-map.service';
import {HsUtilsService} from '../utils/utils.service';
import {getShowInLayerManager, getTitle} from '../../common/layer-extensions';

@Injectable({providedIn: 'root'})
export class HsShareUrlService {
  url_generation = true;
  //some of the code is taken from http://stackoverflow.com/questions/22258793/set-url-parameters-without-causing-page-refresh
  paramTimer = null;
  shareId = null;
  current_url = '';
  permalinkRequestUrl = '';
  params = {};
  customParams = {};
  updateDebouncer = {};
  id: any;
  urlUntilParams: string;
  param_string: string;
  public statusSaving = false;
  public browserUrlUpdated: Subject<any> = new Subject();

  constructor(
    public HsMapService: HsMapService,
    public HsCore: HsCoreService,
    public HsUtilsService: HsUtilsService,
    public HsSaveMapService: HsSaveMapService,
    public HsConfig: HsConfig,
    public HsLanguageService: HsLanguageService,
    public HsLayoutService: HsLayoutService,
    public HsEventBusService: HsEventBusService,
    private Location: Location,
    private zone: NgZone,
    private PlatformLocation: PlatformLocation
  ) {
    this.HsMapService.loaded().then((map) => this.init(map));
  }

  /**
   * Get actual map state information (visible layers, added layers*, active panel, map center and zoom level), create full Url link and push it in Url bar. (*Added layers are ommited from permalink url).
   */
  update(): void {
    const view = this.HsMapService.map.getView();
    this.id = this.HsUtilsService.generateUuid();

    const externalLayers = this.HsMapService.map
      .getLayers()
      .getArray()
      .filter((lyr) => !(getShowInLayerManager(lyr) === false));
    const visibleLayers = externalLayers
      .filter((lyr) => lyr.getVisible())
      .map((lyr) => getTitle(lyr));

    const addedLayers = externalLayers.filter(
      (lyr) => !this.HsConfig.default_layers?.includes(lyr)
    );
    //This might become useful, but url size is limited, so we are not using it
    const addedLayersJson = this.HsSaveMapService.layers2json(addedLayers);

    if (this.HsLayoutService.mainpanel) {
      if (this.HsLayoutService.mainpanel == 'permalink') {
        this.push('hs_panel', 'layermanager');
      } else {
        this.push('hs_panel', this.HsLayoutService.mainpanel);
      }
    }
    this.push('hs_x', view.getCenter()[0]);
    this.push('hs_y', view.getCenter()[1]);
    this.push('hs_z', view.getZoom());
    if (this.HsLanguageService.language) {
      this.push('lang', this.HsLanguageService.language);
    }
    this.push('visible_layers', visibleLayers.join(';'));
    if (this.HsCore.puremapApp) {
      this.push('puremap', 'true');
    }
    for (const cP in this.customParams) {
      this.push(cP, this.customParams[cP]);
    }
    if (this.statusSaving) {
      return;
    }
    this.HsUtilsService.debounce(
      () => {
        let locationPath = this.pathName();
        const paramsSerialized = Object.keys(this.params)
          .map((key) => {
            return {key, value: this.params[key]};
          })
          .map((dic) => `${dic.key}=${encodeURIComponent(dic.value)}`)
          .join('&');
        const baseHref = this.PlatformLocation.getBaseHrefFromDOM();
        if (locationPath.indexOf(baseHref) == 0) {
          locationPath = locationPath.replace(baseHref, '');
        }
        this.Location.replaceState(locationPath, paramsSerialized);
        this.browserUrlUpdated.next();
      },
      300,
      false,
      this.updateDebouncer
    )();
  }

  /**
   * @returns Permalink url
   * Create permalink Url to map
   */
  getPermalinkUrl(): string {
    if (this.HsCore.isMobile() && this.HsConfig.permalinkLocation) {
      return (
        this.HsConfig.permalinkLocation.origin +
        this.current_url.replace(
          this.pathName(),
          this.HsConfig.permalinkLocation.pathname
        ) +
        '&permalink=' +
        encodeURIComponent(this.permalinkRequestUrl)
      ).replace(this.pathName(), this.HsConfig.permalinkLocation.pathname);
    } else {
      return `${this.current_url}&permalink=${encodeURIComponent(
        this.permalinkRequestUrl
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
   * @returns Embeded url
   * Create Url for PureMap version of map
   */
  getPureMapUrl(): string {
    const params: any = {puremap: 'true'};
    return (
      this.getPermalinkUrl() +
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
   * @param param Param to get current value
   * @returns Current value for requested param or null if param doesn't exist
   * Find current param value from Url
   */
  getParamValue(param: string): string {
    const tmp = this.parse(location.search);
    if (tmp[param]) {
      return tmp[param];
    } else {
      return;
    }
  }

  /**
   * @param params A dictionary of custom parameters which get added to the generated url
   * Update values for custom parameters which get added to the url and usually are application speciffic
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

  /**
   * @param map Openlayers map
   */
  private init(map: Map): void {
    if (this.url_generation) {
      let timer = null;
      this.HsEventBusService.mapExtentChanges.subscribe(
        this.HsUtilsService.debounce(
          (data) => {
            this.zone.run(() => {
              this.update();
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
            this.update();
          }, 1000);
        });
      });
      if (this.getParamValue('lang')) {
        this.HsLanguageService.setLanguage(this.getParamValue('lang'));
      }
      const view = this.getParamValue('view');
      // this.HsMapService.visible = !(view == '3d');
    }
  }
}
