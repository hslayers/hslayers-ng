import {Injectable} from '@angular/core';

import {BehaviorSubject} from 'rxjs';

import {EndpointErrorHandling, HsEndpoint} from './endpoint.interface';
import {HsCommonLaymanService} from '../layman/layman.service';
import {HsConfig} from '../../config.service';
import {HsUtilsService} from '../../components/utils/utils.service';

@Injectable({providedIn: 'root'})
export class HsCommonEndpointsService {
  endpointsFilled: BehaviorSubject<{endpoints: HsEndpoint[]; app: string}> =
    new BehaviorSubject(null);
  endpoints: HsEndpoint[];

  constructor(
    public hsConfig: HsConfig,
    public hsCommonLaymanService: HsCommonLaymanService,
    public hsUtilsService: HsUtilsService
  ) {}

  init(_app: string): void {
    this.fillEndpoints(_app);
    this.hsConfig.configChanges.subscribe(({app, config}) => {
      if (app == _app) {
        this.fillEndpoints(app);
      }
    });
  }

  private fillEndpoints(app: string) {
    this.endpoints = [
      ...(this.hsConfig.get(app).status_manager_url
        ? [
            {
              type: 'statusmanager',
              title: 'Status manager',
              url: this.hsConfig.get(app).status_manager_url,
              onError: {compositionLoad: EndpointErrorHandling.ignore},
            },
          ]
        : []),
      ...(this.hsConfig.get(app).datasources || []).map((ds) => {
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
            await this.hsCommonLaymanService.getCurrentUserIfNeeded(tmp, app),
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
        this.endpoints.find((ep) => ep.type.includes('layman'))
      );
      this.endpointsFilled.next({endpoints: this.endpoints, app});
    }
  }
  getItemsPerPageConfig(endpoint): number {
    return endpoint.paging !== undefined &&
      endpoint.paging.itemsPerPage !== undefined
      ? endpoint.paging.itemsPerPage
      : 10;
  }
}
