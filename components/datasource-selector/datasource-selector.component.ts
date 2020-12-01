/* eslint-disable @typescript-eslint/no-unused-vars */
import {Component} from '@angular/core';

import {HsCommonEndpointsService} from '../../common/endpoints/endpoints.service';
import {HsConfig} from '../../config.service';
import {HsCoreService} from '../core/core.service';
import {HsDatasourcesMapService} from './datasource-selector-map.service';
import {HsDatasourcesService} from './datasource-selector.service';
import {HsEndpoint} from '../../common/endpoints/endpoint.interface';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsLogService} from '../../common/log/log.service';

@Component({
  selector: 'hs-datasource-selector',
  template: require('./partials/datasource-selector.html'),
})
export class HsDatasourcesComponent {
  data;
  advancedSearch;

  constructor(
    public hsCommonEndpointsService: HsCommonEndpointsService, //Used in template
    public hsConfig: HsConfig, //Used in template
    public hsCore: HsCoreService, //Used in template
    public hsDatasourcesService: HsDatasourcesService,
    public hsDatasourcesMapService: HsDatasourcesMapService, //Used in template
    public hsEventBusService: HsEventBusService,
    public hsLayoutService: HsLayoutService
  ) {
    this.data = hsDatasourcesService.data;
    this.advancedSearch = false;

    this.hsEventBusService.owsConnecting.subscribe(({type, uri, layer}) => {
      if (type == 'WMS') {
        this.data.wms_connecting = true;
      }
    });
  }

  /**
   * @function getPreviousRecords
   * @param {HsEndpoint} endpoint Selected datasource
   * @description Loads previous records of datasets from selected datasource (based on number of results per page and current start)
   */
  getPreviousRecords(endpoint: HsEndpoint): void {
    const paging = endpoint.datasourcePaging;
    const itemsPerPage = endpoint.paging.itemsPerPage;
    if (paging.start - itemsPerPage < 0) {
      paging.start = 0;
      paging.next = itemsPerPage;
    } else {
      paging.start -= itemsPerPage;
      paging.next = paging.start + itemsPerPage;
    }
    this.hsDatasourcesService.queryCatalog(endpoint);
  }

  /**
   * @function getNextRecords
   * @param {HsEndpoint} endpoint Selected datasource
   * @description Loads next records of datasets from selected datasource (based on number of results per page and current start)
   */
  getNextRecords(endpoint: HsEndpoint): void {
    const paging = endpoint.datasourcePaging;
    const itemsPerPage = endpoint.paging.itemsPerPage;
    if (paging.next != 0) {
      paging.start = Math.floor(paging.next / itemsPerPage) * itemsPerPage;
      if (paging.next + itemsPerPage > paging.matched) {
        paging.next = paging.matched;
      } else {
        paging.next += itemsPerPage;
      }
      this.hsDatasourcesService.queryCatalog(endpoint);
    }
  }

  datasetSelect(id_selected: string, endpoint?: HsEndpoint): void {
    this.hsDatasourcesService.datasetSelect(id_selected);
    if (endpoint) {
      this.hsDatasourcesService.selectedEndpoint = endpoint;
    }
  }
  reload(): void {
    this.hsDatasourcesService.reloadData();
  }
}
