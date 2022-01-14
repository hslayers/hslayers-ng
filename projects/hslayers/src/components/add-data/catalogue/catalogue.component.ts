import {Component} from '@angular/core';

import {DatasetType} from '../add-data.service';
import {HsAddDataCatalogueMapService} from './catalogue-map.service';
import {HsAddDataCatalogueService} from './catalogue.service';
import {HsAddDataLayerDescriptor} from './layer-descriptor.model';
import {HsCommonEndpointsService} from '../../../common/endpoints/endpoints.service';
import {HsConfig} from '../../../config.service';
import {HsCoreService} from '../../core/core.service';
import {HsEndpoint} from '../../../common/endpoints/endpoint.interface';
import {HsLanguageService} from '../../language/language.service';
import {HsLaymanService} from '../../save-map/layman.service';
import {HsLayoutService} from '../../layout/layout.service';
import {HsUtilsService} from '../../utils/utils.service';

// import {HsDragDropLayerService} from './drag-drop-layer.service';

@Component({
  selector: 'hs-add-data-catalogue',
  templateUrl: './catalogue.component.html',
})
export class HsAddDataCatalogueComponent {
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
  constructor(
    public hsLanguageService: HsLanguageService,
    public hsCommonEndpointsService: HsCommonEndpointsService, //Used in template
    public hsConfig: HsConfig, //Used in template
    public hsCore: HsCoreService, //Used in template
    public hsAddDataCatalogueService: HsAddDataCatalogueService,
    public hsAddDataCatalogueMapService: HsAddDataCatalogueMapService, //Used in template
    public hsLayoutService: HsLayoutService,
    public hsUtilsService: HsUtilsService,
    public hsLaymanService: HsLaymanService //Used in template
  ) {
    this.data = hsAddDataCatalogueService.data;
    this.advancedSearch = false;
    this.queryCatalogs = () => hsAddDataCatalogueService.queryCatalogs();
    this.loaderImage =
      this.hsUtilsService.getAssetsPath() + 'img/ajax-loader.gif';
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

  datasetSelect(id_selected: DatasetType, endpoint?: HsEndpoint): void {
    this.hsAddDataCatalogueService.datasetSelect(id_selected);
    if (endpoint) {
      this.hsAddDataCatalogueService.selectedEndpoint = endpoint;
    }
  }
}
