import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {TranslateModule} from '@ngx-translate/core';

import {HsAddDataCatalogueComponent} from './add-data-catalogue.component';
import {HsAddDataListItemComponent} from './add-data-list-item.component';
import {HsAddDataMetadataDialogComponent} from './add-data-catalogue-metadata-dialog.component';
import {HsLaymanModule} from '../../../common/layman/layman.module';
import {HsUiExtensionsModule} from '../../../common/widgets/ui-extensions.module';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [
    HsAddDataCatalogueComponent,
    HsAddDataListItemComponent,
    HsAddDataMetadataDialogComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    HsUiExtensionsModule,
    HsLaymanModule,
    NgbModule,
  ],
  exports: [
    HsAddDataCatalogueComponent,
    HsAddDataListItemComponent,
    HsAddDataMetadataDialogComponent,
  ],
  entryComponents: [
    HsAddDataCatalogueComponent,
    HsAddDataListItemComponent,
    HsAddDataMetadataDialogComponent,
  ],
})
export class HsAddDataCatalogueModule {}
