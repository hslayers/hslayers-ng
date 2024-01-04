import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';

import {lastValueFrom, takeUntil} from 'rxjs';

import {CapabilitiesResponseWrapper} from './capabilities-response-wrapper';
import {HsAddDataService} from 'hslayers-ng/components/add-data';
import {HsCapabilityCacheService} from './capability-cache.service';
import {HsEventBusService} from 'hslayers-ng/shared/core';
import {HsMapService} from 'hslayers-ng/shared/map';
import {HsUtilsService} from 'hslayers-ng/shared/utils';
import {IGetCapabilities} from './get-capabilities.interface';

@Injectable({providedIn: 'root'})
export class HsWfsGetCapabilitiesService implements IGetCapabilities {
  service_url: any;
  constructor(
    private httpClient: HttpClient,
    public hsEventBusService: HsEventBusService,
    public hsMapService: HsMapService,
    public hsUtilsService: HsUtilsService,
    public hsAddDataService: HsAddDataService,
    public hsCapabilityCacheService: HsCapabilityCacheService,
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
   * @param owrCache - Overwrites cache for the requested url
   * @returns Promise object - Response to GetCapabilities request
   */
  async request(
    service_url: string,
    owrCache?: boolean,
  ): Promise<CapabilitiesResponseWrapper> {
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
      params.version = '2.0.0';
    }
    let url = [path, this.params2String(params)].join('?');

    url = this.hsUtilsService.proxify(url);
    if (this.hsCapabilityCacheService.get(url) && !owrCache) {
      return this.hsCapabilityCacheService.get(url);
    }
    try {
      let r = await lastValueFrom(
        this.httpClient
          .get(url, {
            responseType: 'text',
            observe: 'response', // Set observe to 'response' to get headers as well
          })
          .pipe(takeUntil(this.hsAddDataService.cancelUrlRequest)),
      );
      /**
       * Retry with different version number
       */
      if (r.body.includes('ServiceException')) {
        r = await lastValueFrom(
          this.httpClient
            .get(url.replace('version=2.0.0', 'version=1.1.0'), {
              responseType: 'text',
              observe: 'response', // Set observe to 'response' to get headers as well
            })
            .pipe(takeUntil(this.hsAddDataService.cancelUrlRequest)),
        );
      }
      const contentType = r.headers.get('Content-Type');
      if (contentType?.includes('text/html')) {
        return {
          error: true,
          response: {
            message: 'ERROR.noValidData',
          },
        };
      }
      const wrap = {response: r.body};
      this.hsCapabilityCacheService.set(url, wrap);
      return wrap;
    } catch (e) {
      return {response: e, error: true};
    }
  }
}
