import {Injectable} from '@angular/core';

import {BehaviorSubject} from 'rxjs';

import {HsCommonLaymanService} from 'hslayers-ng/common/layman';
import {HsConfig} from 'hslayers-ng/config';
import {HsEndpoint} from 'hslayers-ng/common/types';
import {HsUtilsService} from 'hslayers-ng/shared/utils';

@Injectable({providedIn: 'root'})
export class HsCommonEndpointsService {
  endpointsFilled: BehaviorSubject<HsEndpoint[]> = new BehaviorSubject(null);
  endpoints: HsEndpoint[];

  constructor(
    public hsConfig: HsConfig,
    public hsCommonLaymanService: HsCommonLaymanService,
    public hsUtilsService: HsUtilsService,
  ) {
    this.fillEndpoints();
    this.hsConfig.configChanges.subscribe(() => {
      this.fillEndpoints();
    });
  }

  private fillEndpoints() {
    this.endpoints = [
      ...(this.hsConfig.datasources || []).map((ds) => {
        const tmp = {
          url: ds.url,
          id: this.hsUtilsService.generateUuid(),
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
          user: undefined,
          getCurrentUserIfNeeded: async () =>
            await this.hsCommonLaymanService.getCurrentUserIfNeeded(tmp),
        };
        return tmp;
      }),
    ]
      /**
       * Sort endpoints in order to give layman's
       * layers priority in duplicate filtering.
       */
      .sort((a, b) => a.type.localeCompare(b.type));

    if (this.endpoints) {
      this.hsCommonLaymanService.layman$.next(
        this.endpoints.find((ep) => ep.type.includes('layman')),
      );
      this.endpointsFilled.next(this.endpoints);
    }
  }
  getItemsPerPageConfig(endpoint): number {
    return endpoint.paging !== undefined &&
      endpoint.paging.itemsPerPage !== undefined
      ? endpoint.paging.itemsPerPage
      : 10;
  }
}
