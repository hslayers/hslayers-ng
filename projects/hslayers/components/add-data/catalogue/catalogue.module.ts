import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';

import {HsAddDataCatalogueComponent} from './catalogue.component';
import {HsCatalogueListItemComponent} from './catalogue-list-item/catalogue-list-item.component';
import {HsCatalogueMetadataComponent} from './catalogue-metadata/catalogue-metadata.component';
import {HsCatalogueMetadataModule} from './catalogue-metadata/catalogue-metadata.module';
import {HsLaymanModule} from 'hslayers-ng/common/layman';
import {HsPagerModule} from 'hslayers-ng/common/pager';
import {HsUiExtensionsModule} from 'hslayers-ng/common/widgets';
import {TranslateCustomPipe} from 'hslayers-ng/shared/language';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [HsAddDataCatalogueComponent, HsCatalogueListItemComponent],
  imports: [
    CommonModule,
    FormsModule,
    TranslateCustomPipe,
    HsUiExtensionsModule,
    HsLaymanModule,
    NgbDropdownModule,
    HsPagerModule,
    HsCatalogueMetadataModule,
  ],
  exports: [
    HsAddDataCatalogueComponent,
    HsCatalogueListItemComponent,
    HsCatalogueMetadataComponent,
  ],
})
export class HsAddDataCatalogueModule {}
