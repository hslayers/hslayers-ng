import {Inject, Injectable} from '@angular/core';
import {Location} from '@angular/common';
import {Subject} from 'rxjs';

import {Map} from 'ol';

import {HsConfig} from '../../config.service';
import {HsCoreService} from '../core/core.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLanguageService} from '../language/language.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsMapService} from '../map/map.service';
import {HsSaveMapService} from '../save-map/save-map.service';
import {HsUtilsService} from '../utils/utils.service';
import {WINDOW} from '../utils/window';

@Injectable({providedIn: 'root'})
export class HsShareUrlService {
  url_generation = true;
  //some of the code is taken from http://stackoverflow.com/questions/22258793/set-url-parameters-without-causing-page-refresh
  paramTimer = null;
  shareId = null;
  current_url = '';
  permalinkRequestUrl = '';
  //TODO: remove keeping track of added layers, because permalink should also be generated on other cases like remove layer, visibility change etc.
  added_layers = [];
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
    private Location: Location
  ) {
    this.HsMapService.loaded().then((map) => this.init(map));
  }

  /**
   * @function update
   * @memberof HsPermalinkUrlService
   * @description Get actual map state information (visible layers, added layers*, active panel, map center and zoom level), create full Url link and push it in Url bar. (*Added layers are ommited from permalink url).
   */
  update(): void {
    const view = this.HsMapService.map.getView();
    this.id = this.HsUtilsService.generateUuid();
    const visible_layers = [];
    const added_layers = [];
    this.HsMapService.map.getLayers().forEach((lyr) => {
      if (
        lyr.get('show_in_manager') !== undefined &&
        lyr.get('show_in_manager') !== null &&
        lyr.get('show_in_manager') == false
      ) {
        return;
      }
      if (lyr.getVisible()) {
        visible_layers.push(lyr.get('title'));
      }
      if (lyr.get('manuallyAdded')) {
        added_layers.push(lyr);
      }
    });
    this.added_layers = this.HsSaveMapService.layers2json(added_layers);

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
    this.push('visible_layers', visible_layers.join(';'));
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
        const locationPath = this.pathName();
        const paramsSerialized = Object.keys(this.params)
          .map((key) => {
            return {key, value: this.params[key]};
          })
          .map((dic) => `${dic.key}=${encodeURIComponent(dic.value)}`)
          .join('&');
        this.Location.replaceState(locationPath, paramsSerialized);
        this.browserUrlUpdated.next();
      },
      300,
      false,
      this.updateDebouncer
    )();
  }

  /**
   * @function getPermalinkUrl
   * @memberof HsPermalinkUrlService
   * @returns {string} Permalink url
   * @description Create permalink Url to map
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
   * @function getPureMapUrl
   * @memberof HsPermalinkUrlService
   * @returns {string} Embeded url
   * @description Create Url for PureMap version of map
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
   * @function parse
   * @memberof HsPermalinkUrlService
   * @param {string} str Parameter string to parse
   * @returns {object} Parsed parameter object
   * @description Parse parameter string from Url into key-value(s) pairs
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
   * @function stringify
   * @memberof HsPermalinkUrlService
   * @param {object} obj Parameter object to stringify
   * @returns {string} Encoded parameter string or "" if no parameter object is given
   * @description Create encoded parameter string from parameter object
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
   * @function push
   * @memberof HsPermalinkUrlService
   * @param {object} key Key name for pushed parameter
   * @param {object} new_value Value for pushed parameter
   * @description Push new key-value pair into paramater object and update Url string with new params
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
   * @function getParamValue
   * @memberof HsPermalinkUrlService
   * @param {string} param Param to get current value
   * @returns {string} Current value for requested param or null if param doesn't exist
   * @description Find current param value from Url
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
   * @function updateCustomParams
   * @memberof HsPermalinkUrlService
   * @param {object} params A dictionary of custom parameters which get added to the generated url
   * @description Update values for custom parameters which get added to the url and usually are application speciffic
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
   * @function init
   * @memberof HsPermalinkUrlService
   * @param {Map} map Openlayers map
   * @private
   */
  init(map: Map): void {
    if (this.url_generation) {
      let timer = null;
      this.HsEventBusService.mapExtentChanges.subscribe(
        this.HsUtilsService.debounce(
          (data) => {
            this.update();
          },
          200,
          false,
          this
        )
      );
      map.getLayers().on('add', (e) => {
        const layer = e.element;
        if (
          layer.get('show_in_manager') !== null &&
          layer.get('show_in_manager') == false
        ) {
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
