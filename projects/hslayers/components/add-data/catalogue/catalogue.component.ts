import {Component, computed, OnInit, signal, inject} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';
import {TranslatePipe} from '@ngx-translate/core';

import {
  HsAddDataCatalogueMapService,
  HsAddDataService,
  HsAddDataCatalogueService,
} from 'hslayers-ng/services/add-data';
import {HsAddDataLayerDescriptor} from 'hslayers-ng/types';
import {
  HsCommonLaymanService,
  HsLaymanCurrentUserComponent,
} from 'hslayers-ng/common/layman';
import {HsConfig} from 'hslayers-ng/config';
import {HsLanguageService} from 'hslayers-ng/services/language';
import {HsLaymanService} from 'hslayers-ng/services/save-map';
import {HsLayoutService} from 'hslayers-ng/services/layout';
import {HsPagerModule} from 'hslayers-ng/common/pager';
import {HsCatalogueListItemComponent} from './catalogue-list-item/catalogue-list-item.component';

@Component({
  selector: 'hs-add-data-catalogue',
  templateUrl: './catalogue.component.html',
  imports: [
    FormsModule,
    HsPagerModule,
    NgbDropdownModule,
    TranslatePipe,
    HsCatalogueListItemComponent,
    HsLaymanCurrentUserComponent,
  ],
})
export class HsAddDataCatalogueComponent implements OnInit {
  hsLanguageService = inject(HsLanguageService);
  hsConfig = inject(HsConfig);
  hsAddDataCatalogueService = inject(HsAddDataCatalogueService);
  hsAddDataCatalogueMapService = inject(HsAddDataCatalogueMapService);
  hsLayoutService = inject(HsLayoutService);
  hsLaymanService = inject(HsLaymanService);
  hsCommonLaymanService = inject(HsCommonLaymanService);
  private hsAddDataService = inject(HsAddDataService);

  types: any[];
  data: any;
  advancedSearch: boolean;

  filterTypeMenu = signal(false);
  optionsButtonLabel = computed(() =>
    this.filterTypeMenu() ? 'less' : 'more',
  );

  readonly textFieldTypes = ['AnyText', 'Abstract', 'Title'];
  readonly dataTypes = ['all', 'service', 'dataset'];
  readonly sortbyTypes = ['date', 'title', 'bbox'];

  constructor() {
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

  toggleFilterTypeMenu(): void {
    this.filterTypeMenu.update((value) => !value);
  }

  queryByFilter(): void {
    /*
     * A bit tricky way how to force add-data hs-panel-header to refresh its template
     * in order to show/hide buttons. Previously done by reloadData call.
     * This achieves the same via datasetTypeSelected subscription in catalogue service
     */
    this.hsAddDataService.datasetSelected.next(
      this.hsAddDataService.datasetSelected.getValue(),
    );
  }

  selectType(type: string): void {
    this.data.textField = type;
    if (this.data.query.textFilter.length > 0) {
      this.queryByFilter();
    }
  }

  selectQueryType(type: string, query: string): void {
    this.data.query[query] = type;
    this.queryByFilter();
  }

  highlightLayer(layer, state: boolean): void {
    layer.highlighted = state;
    this.hsAddDataCatalogueMapService.highlightLayer(layer, state);
  }
}
