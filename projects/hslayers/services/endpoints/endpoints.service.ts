import {inject, Injectable} from '@angular/core';

import {HsConfig} from 'hslayers-ng/config';
import {HsEndpoint} from 'hslayers-ng/types';
import {toSignal} from '@angular/core/rxjs-interop';
import {of, switchMap} from 'rxjs';

@Injectable({providedIn: 'root'})
export class HsCommonEndpointsService {
  hsConfig = inject(HsConfig);

  endpoints = toSignal(
    this.hsConfig.configChanges.pipe(switchMap(() => of(this.fillEndpoints()))),
    {initialValue: [] as HsEndpoint[]},
  );

  private fillEndpoints(): HsEndpoint[] {
    const endpoints = (this.hsConfig.datasources || []).map(
      (ds) =>
        ({
          url: ds.url,
          id: crypto.randomUUID(),
          type: ds.type,
          title: ds.title,
          onError: ds.onError,
          datasourcePaging: {
            start: 0,
            limit: this.getItemsPerPageConfig(ds),
            loaded: false,
          },
          compositionsPaging: {
            start: 0,
            limit: this.getItemsPerPageConfig(ds),
            loaded: false,
          },
          paging: {
            itemsPerPage: this.getItemsPerPageConfig(ds),
          },
        }) as HsEndpoint,
    );

    // Sort endpoints to give layman's layers priority in duplicate filtering
    return endpoints.sort((a, b) => a.type.localeCompare(b.type));
  }
  /**
   * Get items per page config
   * @param endpoint - Endpoint
   * @returns number
   */
  getItemsPerPageConfig(endpoint): number {
    return endpoint.paging !== undefined &&
      endpoint.paging.itemsPerPage !== undefined
      ? endpoint.paging.itemsPerPage
      : 10;
  }
}
