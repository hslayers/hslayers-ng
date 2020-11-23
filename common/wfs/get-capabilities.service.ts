import {HsEventBusService} from '../../components/core/event-bus.service';
import {HsMapService} from '../../components/map/map.service';
import {HsUtilsService} from '../../components/utils/utils.service';
import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';

@Injectable({providedIn: 'root'})
export class HsWfsGetCapabilitiesService {
  service_url: any;
  constructor(
    private HttpClient: HttpClient,
    public HsEventBusService: HsEventBusService,
    public HsMapService: HsMapService,
    public HsUtilsService: HsUtilsService
  ) {}
  /**
   * Get WFS service location without parameters from url string
   *
   * @memberof HsWfsGetCapabilitiesService
   * @function getPathFromUrl
   * @param {string} str Url string to parse
   * @returns {string} WFS service Url without params
   */
  getPathFromUrl(str) {
    if (str.indexOf('?') > -1) {
      return str.substring(0, str.indexOf('?'));
    } else {
      return str;
    }
  }

  /**
   * TODO: Probably the same as utils.paramsToURL
   * Create WFS parameter string from parameter object
   *
   * @memberof HsWfsGetCapabilitiesService
   * @function param2String
   * @param {object} obj Object with stored WFS service parameters
   * @returns {string} Parameter string or empty string if no object given
   */
  params2String(obj) {
    return obj
      ? Object.keys(obj)
          .map((key) => {
            const val = obj[key];

            if (Array.isArray(val)) {
              return val
                .map((val2) => {
                  return (
                    encodeURIComponent(key) + '=' + encodeURIComponent(val2)
                  );
                })
                .join('&');
            }

            return encodeURIComponent(key) + '=' + encodeURIComponent(val);
          })
          .join('&')
      : '';
  }

  /**
   * Parse added service url and sends request GetCapabalities to WFS service
   *
   * @memberof HsWfsGetCapabilitiesService
   * @function requestGetCapabilities
   * @param {string} service_url Raw Url localization of service
   * @returns {Promise} Promise object -  Response to GetCapabalities request
   */
  async requestGetCapabilities(service_url: string): Promise<any> {
    service_url = service_url.replace(/&amp;/g, '&');
    this.service_url = service_url;
    const params = this.HsUtilsService.getParamsFromUrl(service_url);
    const path = this.getPathFromUrl(service_url);
    if (params.request == undefined && params.REQUEST == undefined) {
      params.request = 'GetCapabilities';
    } else if (params.request !== undefined) {
      params.request = 'GetCapabilities';
    } else if (params.REQUEST !== undefined) {
      params.REQUEST = 'GetCapabilities';
    }
    if (params.service == undefined && params.SERVICE == undefined) {
      params.service = 'WFS';
    }
    if (params.version == undefined && params.VERSION == undefined) {
      params.version = '1.1.0';
    }
    let url = [path, this.params2String(params)].join('?');

    url = this.HsUtilsService.proxify(url);
    const r = await this.HttpClient.get(url, {
      responseType: 'text',
    }).toPromise();

    this.HsEventBusService.owsCapabilitiesReceived.next({
      type: 'WFS',
      response: r,
    });

    return r;
  }

  /**
   * Test if current map projection is in supported projection list
   *
   * @memberof HsWfsGetCapabilitiesService
   * @function currentProjectionSupported
   * @param {Array} srss List of supported projections
   * @returns {boolean} True if map projection is in list, otherwise false
   */
  currentProjectionSupported(srss): boolean {
    let found = false;
    for (const val of srss) {
      if (
        val
          .toUpperCase()
          .indexOf(
            this.HsMapService.map
              .getView()
              .getProjection()
              .getCode()
              .toUpperCase()
              .replace('EPSG:', 'EPSG::')
          ) > -1
      ) {
        found = true;
      }
    }
    return found;
  }

  /**
   * (DEPRECATED ?)
   *
   * @param url
   * @param use_proxy
   */
  getUrl(url: string, use_proxy?: boolean): string {
    if (use_proxy == undefined || !use_proxy) {
      return url;
    } else {
      return (
        '/cgi-bin/proxy4ows.cgi?OWSURL=' +
        encodeURIComponent(url) +
        '&owsService=WMS'
      );
    }
  }
}
