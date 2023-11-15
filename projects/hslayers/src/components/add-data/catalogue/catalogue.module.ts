import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';

import {HsAddDataCatalogueComponent} from './catalogue.component';
import {HsCatalogueListItemComponent} from './catalogue-list-item/catalogue-list-item.component';
import {HsCatalogueMetadataComponent} from './catalogue-metadata/catalogue-metadata.component';
import {HsCatalogueMetadataModule} from './catalogue-metadata/catalogue-metadata.module';
import {TranslateCustomPipe} from '../../language/translate-custom.pipe';
import {HsLaymanModule} from '../../../common/layman/layman.module';
import {HsPagerModule} from '../../../common/pager/pager.module';
import {HsUiExtensionsModule} from '../../../common/widgets/ui-extensions.module';

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
