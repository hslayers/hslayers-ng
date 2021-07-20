import {Component, OnDestroy} from '@angular/core';

import {Subscription} from 'rxjs';

import {HsAddDataCatalogueMapService} from './add-data-catalogue-map.service';
import {HsAddDataCatalogueService} from './add-data-catalogue.service';
import {HsAddDataLayerDescriptor} from './add-data-layer-descriptor.interface';
import {HsCommonEndpointsService} from '../../../common/endpoints/endpoints.service';
import {HsConfig} from '../../../config.service';
import {HsCoreService} from '../../core/core.service';
import {HsEndpoint} from '../../../common/endpoints/endpoint.interface';
import {HsEventBusService} from '../../core/event-bus.service';
import {HsLanguageService} from '../../language/language.service';
import {HsLaymanService} from '../../save-map/layman.service';
import {HsLayoutService} from '../../layout/layout.service';
import {HsUtilsService} from '../../utils/utils.service';

// import {HsDragDropLayerService} from './drag-drop-layer.service';

@Component({
  selector: 'hs-add-data-catalogue',
  templateUrl: './add-data-catalogue.html',
})
export class HsAddDataCatalogueComponent implements OnDestroy {
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
  optionsButtonLabel = 'more';
  owsConnectingSubscription: Subscription;
  constructor(
    public hsLanguageService: HsLanguageService,
    public hsCommonEndpointsService: HsCommonEndpointsService, //Used in template
    public hsConfig: HsConfig, //Used in template
    public hsCore: HsCoreService, //Used in template
    public hsAddDataCatalogueService: HsAddDataCatalogueService,
    public hsAddDataCatalogueMapService: HsAddDataCatalogueMapService, //Used in template
    public hsEventBusService: HsEventBusService,
    public hsLayoutService: HsLayoutService,
    public hsUtilsService: HsUtilsService,
    public hsLaymanService: HsLaymanService //Used in template
  ) {
    this.data = hsAddDataCatalogueService.data;
    this.advancedSearch = false;
    this.queryCatalogs = () => hsAddDataCatalogueService.queryCatalogs();
    this.owsConnectingSubscription =
      this.hsEventBusService.owsConnecting.subscribe(({type, uri, layer}) => {
        if (type == 'wms') {
          this.data.wms_connecting = true;
        }
      });
    this.loaderImage =
      this.hsUtilsService.getAssetsPath() + 'img/ajax-loader.gif';
  }
  ngOnDestroy(): void {
    this.owsConnectingSubscription.unsubscribe();
  }

  layerSelected(layer: HsAddDataLayerDescriptor): void {
    this.hsAddDataCatalogueService.selectedLayer =
      this.hsAddDataCatalogueService.selectedLayer == layer
        ? <HsAddDataLayerDescriptor>{}
        : layer;
  }

  translateString(module: string, text: string): string {
    return this.hsLanguageService.getTranslationIgnoreNonExisting(module, text);
  }
  openOptionsMenu(): void {
    this.filterTypeMenu = !this.filterTypeMenu;
    if (this.filterTypeMenu) {
      this.optionsButtonLabel = 'less';
    } else {
      this.optionsButtonLabel = 'more';
    }
  }

  queryByFilter(): void {
    this.hsAddDataCatalogueService.reloadData();
  }

  selectType(type: string): void {
    this.data.textField = type;
    if (this.data.query.textFilter.length > 0) {
      this.queryByFilter();
    }
    this.filterTypeMenu = !this.filterTypeMenu;
  }

  selectQueryType(type: string, query: string): void {
    this.data.query[query] = type;
    this.queryByFilter();
    this.filterTypeMenu = !this.filterTypeMenu;
  }

  highlightLayer(layer, state: boolean): void {
    layer.highlighted = state;
    this.hsAddDataCatalogueMapService.highlightLayer(layer, state);
  }

  /**
   * Loads previous records of datasets from selected datasource (based on number of results per page and current start)
   */
  getPreviousRecords(): void {
    this.hsAddDataCatalogueService.getPreviousRecords();
  }

  /**
   * Loads next records of datasets from selected datasource (based on number of results per page and current start)
   */
  getNextRecords(): void {
    this.hsAddDataCatalogueService.getNextRecords();
  }

  resultsVisible(): boolean {
    return this.hsAddDataCatalogueService.listNext &&
      this.hsAddDataCatalogueService.matchedLayers
      ? true
      : false;
  }

  nextPageAvailable(): boolean {
    return (
      this.hsAddDataCatalogueService.matchedLayers >
      this.hsAddDataCatalogueService.listNext
    );
  }

  datasetSelect(id_selected: string, endpoint?: HsEndpoint): void {
    this.hsAddDataCatalogueService.datasetSelect(id_selected);
    if (endpoint) {
      this.hsAddDataCatalogueService.selectedEndpoint = endpoint;
    }
  }
}
