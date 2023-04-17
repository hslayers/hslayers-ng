import {Component, Input, OnInit} from '@angular/core';

import {DatasetType} from '../add-data.service';
import {HsAddDataCatalogueMapService} from './catalogue-map.service';
import {
  HsAddDataCatalogueParams,
  HsAddDataCatalogueService,
} from './catalogue.service';
import {HsAddDataLayerDescriptor} from './layer-descriptor.model';
import {HsCommonLaymanService} from '../../../common/layman/layman.service';
import {HsConfig, HsConfigObject} from '../../../config.service';
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
export class HsAddDataCatalogueComponent implements OnInit {
  types: any[];
  data: any;
  advancedSearch: boolean;
  queryCatalogs;
  filterTypeMenu;
  textFieldTypes = ['AnyText', 'Abstract', 'Title'];
  dataTypes = ['all', 'service', 'dataset'];
  sortbyTypes = ['date', 'title', 'bbox'];
  optionsButtonLabel = 'more';
  constructor(
    public hsLanguageService: HsLanguageService,
    public hsConfig: HsConfig, //Used in template
    public hsCore: HsCoreService, //Used in template
    public hsAddDataCatalogueService: HsAddDataCatalogueService,
    public hsAddDataCatalogueMapService: HsAddDataCatalogueMapService, //Used in template
    public hsLayoutService: HsLayoutService,
    public hsUtilsService: HsUtilsService,
    public hsLaymanService: HsLaymanService, //Used in template
    public hsCommonLaymanService: HsCommonLaymanService
  ) {
    this.advancedSearch = false;
  }
  ngOnInit(): void {
    this.data = this.hsAddDataCatalogueService.data;
    this.queryCatalogs = () => this.hsAddDataCatalogueService.queryCatalogs();
  }

  layerSelected(layer: HsAddDataLayerDescriptor): void {
    this.hsAddDataCatalogueService.selectedLayer =
      this.hsAddDataCatalogueService.selectedLayer == layer
        ? <HsAddDataLayerDescriptor>{}
        : layer;
  }

  translateString(module: string, text: string): string {
    return this.hsLanguageService.getTranslationIgnoreNonExisting(
      module,
      text,
      undefined
    );
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
}
