import * as angular from 'angular';
import {BehaviorSubject} from 'rxjs';
import {HsCommonLaymanService} from '../layman/layman.service';
import {HsConfig} from '../../config.service';
import {HsEndpoint} from './endpoint.interface';
import {Injectable} from '@angular/core';

@Injectable({providedIn: 'root'})
export class HsCommonEndpointsService {
  endpointsFilled: BehaviorSubject<any> = new BehaviorSubject(null);
  endpoints: HsEndpoint[];

  constructor(
    private HsConfig: HsConfig,
    private HsCommonLaymanService: HsCommonLaymanService
  ) {
    this.endpoints = [
      ...(this.HsConfig.status_manager_url
        ? [
            {
              type: 'statusmanager',
              title: 'Status manager',
              url: this.HsConfig.status_manager_url,
            },
          ]
        : []),
      ...(this.HsConfig.datasources || []).map((ds) => {
        const tmp = {
          url: ds.url,
          type: ds.type,
          title: ds.title,
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
            await this.HsCommonLaymanService.getCurrentUserIfNeeded(tmp),
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
    return angular.isDefined(ds.paging) &&
      angular.isDefined(ds.paging.itemsPerPage)
      ? ds.paging.itemsPerPage
      : this.HsConfig.dsPaging || 20;
  }
}
