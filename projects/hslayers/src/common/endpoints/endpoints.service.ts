import {BehaviorSubject} from 'rxjs';
import {EndpointErrorHandling, HsEndpoint} from './endpoint.interface';
import {HsCommonLaymanService} from '../layman/layman.service';
import {HsConfig} from '../../config.service';
import {Injectable} from '@angular/core';

@Injectable({providedIn: 'root'})
export class HsCommonEndpointsService {
  endpointsFilled: BehaviorSubject<any> = new BehaviorSubject(null);
  endpoints: HsEndpoint[];

  constructor(
    public hsConfig: HsConfig,
    public hsCommonLaymanService: HsCommonLaymanService
  ) {
    this.fillEndpoints();
    this.hsConfig.configChanges.subscribe(() => this.fillEndpoints());
  }

  private fillEndpoints() {
    this.endpoints = [
      ...(this.hsConfig.status_manager_url
        ? [
            {
              type: 'statusmanager',
              title: 'Status manager',
              url: this.hsConfig.status_manager_url,
              onError: {compositionLoad: EndpointErrorHandling.ignore},
            },
          ]
        : []),
      ...(this.hsConfig.datasources || []).map((ds) => {
        const tmp = {
          url: ds.url,
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
          user: ds.user,
          liferayProtocol: ds.liferayProtocol,
          originalConfiguredUser: ds.user,
          getCurrentUserIfNeeded: async () =>
            await this.hsCommonLaymanService.getCurrentUserIfNeeded(tmp),
        };
        return tmp;
      }),
    ];

    this.endpointsFilled.next(this.endpoints);
  }

  /**
   * @param ds
   */
  getItemsPerPageConfig(ds) {
    return ds.paging !== undefined && ds.paging.itemsPerPage !== undefined
      ? ds.paging.itemsPerPage
      : this.hsConfig.dsPaging || 10;
  }
}
