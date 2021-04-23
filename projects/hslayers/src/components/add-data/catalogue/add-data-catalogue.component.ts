import {Component} from '@angular/core';
import {HsConfig} from '../../../config.service';
import {HsLanguageService} from '../../language/language.service';

import {HsCommonEndpointsService} from '../../../common/endpoints/endpoints.service';
import {HsCoreService} from '../../core/core.service';

import {HsAddDataCatalogueMapService} from './add-data-catalogue-map.service';
import {HsAddDataCatalogueService} from './add-data-catalogue.service';

import {HsEndpoint} from '../../../common/endpoints/endpoint.interface';
import {HsEventBusService} from '../../core/event-bus.service';
import {HsLaymanService} from '../../save-map/layman.service';
import {HsLayoutService} from '../../layout/layout.service';
import {HsLogService} from '../../../common/log/log.service';
import {HsToastService} from '../../layout/toast/toast.service';
import {HsUtilsService} from '../../utils/utils.service';

// import {HsDragDropLayerService} from './drag-drop-layer.service';

@Component({
  selector: 'hs-add-data-catalogue',
  templateUrl: './add-data-catalogue.html',
})
export class HsAddDataCatalogueComponent {
  typeSelected: string;
  types: any[];
  data: any;
  advancedSearch: boolean;
  queryCatalogs;
  loaderImage;
  filterTypeMenu;
  textFieldTypes = ['AnyText', 'Abstract', 'Title'];
  dataTypes = ['all', 'service', 'dataset'];
  sortbyTypes = ['date', 'title', 'bbox'];
  constructor(
    public HsLanguageService: HsLanguageService,
    public hsCommonEndpointsService: HsCommonEndpointsService, //Used in template
    public hsConfig: HsConfig, //Used in template
    public hsCore: HsCoreService, //Used in template
    public HsAddDataCatalogueService: HsAddDataCatalogueService,
    public HsAddDataCatalogueMapService: HsAddDataCatalogueMapService, //Used in template
    public hsEventBusService: HsEventBusService,
    public hsLayoutService: HsLayoutService,
    public HsUtilsService: HsUtilsService,
    public HsLaymanService: HsLaymanService, //Used in template
    public hsToastService: HsToastService
  ) {
    this.data = HsAddDataCatalogueService.data;
    this.advancedSearch = false;
    this.queryCatalogs = () => HsAddDataCatalogueService.queryCatalogs();
    this.hsEventBusService.owsConnecting.subscribe(({type, uri, layer}) => {
      if (type == 'wms') {
        this.data.wms_connecting = true;
      }
    });
    this.loaderImage =
      this.HsUtilsService.getAssetsPath() + 'img/ajax-loader.gif';
  }

  translateString(module: string, text: string): string {
    return this.HsLanguageService.getTranslationIgnoreNonExisting(module, text);
  }

  extentFilterChanged(): void {
    //Sort by title if not filtering by extent
    if (!this.data.filterByExtent && this.data.query.sortby == 'bbox') {
      this.data.query.sortby = 'title';
    }
    this.queryByFilter();
  }

  queryByFilter(): void {
    this.HsAddDataCatalogueService.reloadData();
  }

  selectType(type: string): void {
    this.data.textField = type;
    if (this.data.query.textFilter.length > 0) {
      this.queryByFilter();
    }
    this.filterTypeMenu = !this.filterTypeMenu;
  }

  selectQueryType(type: string, query: string): void {
    if (type == 'bbox' && !this.data.filterByExtent) {
      this.hsToastService.createToastPopupMessage(
        this.HsLanguageService.getTranslation(
          'ADDLAYERS.wrongCombinationOfParams'
        ),
        this.HsLanguageService.getTranslation('ADDLAYERS.bboxFilterMissing'),
        true
      );
      this.data.query[query] = 'title';
    } else {
      this.data.query[query] = type;
    }
    this.queryByFilter();
    this.filterTypeMenu = !this.filterTypeMenu;
  }

  highlightLayer(layer, state: boolean): void {
    layer.highlighted = state;
    this.HsAddDataCatalogueMapService.highlightLayer(layer, state);
  }

  /**
   * @function getPreviousRecords
   * @param {HsEndpoint} endpoint Selected datasource
   * @description Loads previous records of datasets from selected datasource (based on number of results per page and current start)
   */
  getPreviousRecords(): void {
    this.HsAddDataCatalogueService.getPreviousRecords();
  }

  /**
   * @function getNextRecords
   * @param {HsEndpoint} endpoint Selected datasource
   * @description Loads next records of datasets from selected datasource (based on number of results per page and current start)
   */
  getNextRecords(): void {
    this.HsAddDataCatalogueService.getNextRecords();
  }

  resultsVisible(): boolean {
    return this.HsAddDataCatalogueService.listNext &&
      this.HsAddDataCatalogueService.matchedLayers
      ? true
      : false;
  }

  nextPageAvailable(): boolean {
    return (
      this.HsAddDataCatalogueService.matchedLayers >
      this.HsAddDataCatalogueService.listNext
    );
  }

  datasetSelect(id_selected: string, endpoint?: HsEndpoint): void {
    this.HsAddDataCatalogueService.datasetSelect(id_selected);
    if (endpoint) {
      this.HsAddDataCatalogueService.selectedEndpoint = endpoint;
    }
  }
}
