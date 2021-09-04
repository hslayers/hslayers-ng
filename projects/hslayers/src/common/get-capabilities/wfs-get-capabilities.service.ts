import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';

import {takeUntil} from 'rxjs/operators';

import {CapabilitiesResponseWrapper} from './capabilities-response-wrapper';
import {HsAddDataService} from '../../components/add-data/add-data.service';
import {HsEventBusService} from '../../components/core/event-bus.service';
import {HsMapService} from '../../components/map/map.service';
import {HsUtilsService} from '../../components/utils/utils.service';

@Injectable({providedIn: 'root'})
export class HsWfsGetCapabilitiesService {
  service_url: any;
  constructor(
    private httpClient: HttpClient,
    public hsEventBusService: HsEventBusService,
    public hsMapService: HsMapService,
    public hsUtilsService: HsUtilsService,
    public hsAddDataService: HsAddDataService
  ) {}

  /**
   * Get WFS service location without parameters from url string
   *
   * @param str - Url string to parse
   * @returns WFS service Url without params
   */
  getPathFromUrl(str: string): string {
    if (str.indexOf('?') > -1) {
      return str.substring(0, str.indexOf('?'));
    } else {
      return str;
    }
  }

  /**
   * Create WFS parameter string from parameter object
   * TODO: Probably the same as utils.paramsToURL
   *
   * @param obj - Object with stored WFS service parameters
   * @returns Parameter string or empty string if no object given
   */
  params2String(obj): string {
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
   * Parse added service url and sends request GetCapabilities to WFS service
   *
   * @param service_url - Raw Url localization of service
   * @returns Promise object - Response to GetCapabilities request
   */
  async request(service_url: string): Promise<CapabilitiesResponseWrapper> {
    service_url = service_url.replace(/&amp;/g, '&');
    this.service_url = service_url;
    const params = this.hsUtilsService.getParamsFromUrl(service_url);
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

    url = this.hsUtilsService.proxify(url);

    try {
      const r = await this.httpClient
        .get(url, {
          responseType: 'text',
        })
        .pipe(takeUntil(this.hsAddDataService.cancelUrlRequest))
        .toPromise();
      return {response: r};
    } catch (e) {
      return {response: e, error: true};
    }
  }

  /**
   * Test if current map projection is in supported projection list
   *
   * @param srss - List of supported projections
   * @returns True if map projection is in list, otherwise false
   */
  currentProjectionSupported(srss: string[]): boolean {
    let found = false;
    for (const val of srss) {
      if (
        val
          .toUpperCase()
          .indexOf(
            this.hsMapService.map
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
}
