import {HttpClient} from '@angular/common/http';
import {Injectable, WritableSignal, signal, inject} from '@angular/core';

import {CapabilitiesResponseWrapper} from 'hslayers-ng/types';
import {HsCapabilityCacheService} from './capability-cache.service';
import {HsEventBusService} from 'hslayers-ng/services/event-bus';
import {HsProxyService} from 'hslayers-ng/services/utils';
import {IGetCapabilities} from './get-capabilities.interface';

@Injectable({providedIn: 'root'})
export class HsXyzGetCapabilitiesService implements IGetCapabilities {
  private httpClient = inject(HttpClient);
  private hsEventBusService = inject(HsEventBusService);
  private hsCapabilityCacheService = inject(HsCapabilityCacheService);
  private hsProxyService = inject(HsProxyService);

  service_url: WritableSignal<string> = signal('');

  /**
   * Get XYZ service location without parameters from url string
   */
  getPathFromUrl(str: string): string {
    if (str.indexOf('?') > -1) {
      return str.substring(0, str.indexOf('?'));
    }
    return str;
  }

  /**
   * Create XYZ parameter string from parameter object
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
   * Validate XYZ URL template
   */
  private validateXyzUrl(url: string): boolean {
    // Check if URL contains required XYZ template parameters
    // Support both {y} and {-y} for TMS-style coordinates
    return (
      url.includes('{x}') &&
      (url.includes('{y}') || url.includes('{-y}')) &&
      url.includes('{z}') &&
      (url.startsWith('http://') || url.startsWith('https://'))
    );
  }

  /**
   * Parse added service url and validate XYZ template
   */
  async request(
    service_url: string,
    owrCache?: boolean,
  ): Promise<CapabilitiesResponseWrapper> {
    service_url = service_url.replace(/&amp;/g, '&');
    this.service_url.set(service_url);

    // Validate XYZ URL template
    if (!this.validateXyzUrl(service_url)) {
      return {
        error: true,
        response: {
          message: 'ERROR.invalidXyzUrl',
        },
      };
    }

    // Check cache
    if (this.hsCapabilityCacheService.get(service_url) && !owrCache) {
      return this.hsCapabilityCacheService.get(service_url);
    }

    try {
      // Create a mock capabilities response
      const mockCapabilities = {
        Service: {
          Title: 'XYZ Tile Service',
          Abstract: 'XYZ Tile Service',
        },
        Capability: {
          Layer: {
            Title: 'XYZ Layer',
            Name: 'xyz_layer',
            Abstract: 'XYZ Tile Layer',
            BoundingBox: [-180, -90, 180, 90],
            Style: [
              {
                Name: 'default',
                Title: 'Default',
              },
            ],
          },
        },
      };

      const wrap = {response: mockCapabilities};
      this.hsCapabilityCacheService.set(service_url, wrap);
      return wrap;
    } catch (e) {
      return {response: e, error: true};
    }
  }
}
