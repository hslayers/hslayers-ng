import {Component} from '@angular/core';
import {HsConfig} from '../../../config.service';
import {HsLanguageService} from '../../language/language.service';

import {HsCommonEndpointsService} from '../../../common/endpoints/endpoints.service';
import {HsCoreService} from '../../core/core.service';

import {HsDataCatalogueMapService} from './data-catalogue-map.service';
import {HsDataCatalogueService} from './data-catalogue.service';

import {HsEndpoint} from '../../../common/endpoints/endpoint.interface';
import {HsEventBusService} from '../../core/event-bus.service';
import {HsLaymanService} from '../../save-map/layman.service';
import {HsLayoutService} from '../../layout/layout.service';
import {HsLogService} from '../../../common/log/log.service';
import {HsUtilsService} from '../../utils/utils.service';

// import {HsDragDropLayerService} from './drag-drop-layer.service';

@Component({
  selector: 'hs-data-catalogue',
  templateUrl: './data-catalogue.html',
})
export class HsDataCatalogueComponent {
  typeSelected: string;
  types: any[];
  data: any;
  advancedSearch: boolean;
  queryCatalogs;
  loaderImage;
  
  constructor(
    public HsLanguageService: HsLanguageService,
    public hsCommonEndpointsService: HsCommonEndpointsService, //Used in template
    public hsConfig: HsConfig, //Used in template
    public hsCore: HsCoreService, //Used in template
    public HsDataCatalogueService: HsDataCatalogueService,
    public HsDataCatalogueMapService: HsDataCatalogueMapService, //Used in template
    public hsEventBusService: HsEventBusService,
    public hsLayoutService: HsLayoutService,
    public HsUtilsService: HsUtilsService,
    public HsLaymanService: HsLaymanService //Used in template
  ) {
    this.data = HsDataCatalogueService.data;
    this.advancedSearch = false;
    this.queryCatalogs = () => HsDataCatalogueService.queryCatalogs();
    this.hsEventBusService.owsConnecting.subscribe(({type, uri, layer}) => {
      if (type == 'wms') {
        this.data.wms_connecting = true;
      }
    });
    this.loaderImage =
    this.HsUtilsService.getAssetsPath() + 'img/ajax-loader.gif';
    // this.reload();
  }

  extentFilterChanged(): void {
    this.data.filterByExtent = !this.data.filterByExtent;
    this.queryCatalogs();
  }

  filterByTitle() {
    this.HsDataCatalogueService.resetList();
    this.queryCatalogs();
  }

  /**
   * @function getPreviousRecords
   * @param {HsEndpoint} endpoint Selected datasource
   * @description Loads previous records of datasets from selected datasource (based on number of results per page and current start)
   */
  getPreviousRecords(): void {
    this.HsDataCatalogueService.getPreviousRecords();
  }

  /**
   * @function getNextRecords
   * @param {HsEndpoint} endpoint Selected datasource
   * @description Loads next records of datasets from selected datasource (based on number of results per page and current start)
   */
  getNextRecords(): void {
    this.HsDataCatalogueService.getNextRecords();
  }

  resultsVisible(): boolean {
    return this.HsDataCatalogueService.listNext && this.HsDataCatalogueService.paging.matched ? true : false
  }
  
  nextPageAvailable(): boolean {
    const matched = this.HsDataCatalogueService.paging.matched;
    const next = this.HsDataCatalogueService.listNext
    return matched == next || this.HsDataCatalogueService.catalogEntries.length < this.HsDataCatalogueService.itemsPerPage
  }

  datasetSelect(id_selected: string, endpoint?: HsEndpoint): void {
    this.HsDataCatalogueService.datasetSelect(id_selected);
    if (endpoint) {
      this.HsDataCatalogueService.selectedEndpoint = endpoint;
    }
  }
  reload(): void {
    this.HsDataCatalogueService.reloadData();
  }
}
