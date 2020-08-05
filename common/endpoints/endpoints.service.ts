import * as angular from 'angular';
import {BehaviorSubject} from 'rxjs';
import {HsConfig} from '../../config.service';

/**
 * @param HsConfig
 * @param HsCommonLaymanService
 */
export class HsCommonEndpointsService {
  endpointsFilled: BehaviorSubject<any> = new BehaviorSubject(null);
  HsConfig: HsConfig;
  endpoints: Array<any>; //TODO rewrite any to interface

  constructor(HsConfig, HsCommonLaymanService) {
    'ngInject';
    Object.assign(this, {
      HsConfig,
      HsCommonLaymanService,
    });

    angular.extend(this, {
      endpoints: [
        ...(HsConfig.status_manager_url
          ? [
              {
                type: 'statusmanager',
                title: 'Status manager',
                url: HsConfig.status_manager_url,
              },
            ]
          : []),
        ...(HsConfig.datasources || []).map((ds) => {
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
            getCurrentUserIfNeeded: () =>
              HsCommonLaymanService.getCurrentUserIfNeeded(tmp),
          };
          return tmp;
        }),
      ],
    });
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
