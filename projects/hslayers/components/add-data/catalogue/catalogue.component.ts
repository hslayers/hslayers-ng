import {Component, OnInit} from '@angular/core';

import {HsAddDataCatalogueMapService} from 'hslayers-ng/shared/add-data';
import {HsAddDataCatalogueService} from 'hslayers-ng/shared/add-data';
import {HsAddDataLayerDescriptor} from 'hslayers-ng/common/types';
import {HsCommonLaymanService} from 'hslayers-ng/common/layman';
import {HsConfig} from 'hslayers-ng/config';
import {HsCoreService} from 'hslayers-ng/shared/core';
import {HsLanguageService} from 'hslayers-ng/shared/language';
import {HsLaymanService} from 'hslayers-ng/components/save-map';
import {HsLayoutService} from 'hslayers-ng/shared/layout';
import {HsUtilsService} from 'hslayers-ng/shared/utils';

// import {HsDragDropLayerService} from './drag-drop-layer.service';

@Component({
  selector: 'hs-add-data-catalogue',
  templateUrl: './catalogue.component.html',
})
export class HsAddDataCatalogueComponent implements OnInit {
  types: any[];
  data: any;
  advancedSearch: boolean;
  filterTypeMenu;
  textFieldTypes = ['AnyText', 'Abstract', 'Title'];
  dataTypes = ['all', 'service', 'dataset'];
  sortbyTypes = ['date', 'title', 'bbox'];
  optionsButtonLabel = 'more';
  constructor(
    public hsLanguageService: HsLanguageService,
    public hsConfig: HsConfig,
    public hsCore: HsCoreService,
    public hsAddDataCatalogueService: HsAddDataCatalogueService,
    public hsAddDataCatalogueMapService: HsAddDataCatalogueMapService,
    public hsLayoutService: HsLayoutService,
    public hsUtilsService: HsUtilsService,
    public hsLaymanService: HsLaymanService,
    public hsCommonLaymanService: HsCommonLaymanService,
  ) {
    this.advancedSearch = false;
  }

  ngOnInit(): void {
    this.data = this.hsAddDataCatalogueService.data;
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
      undefined,
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
