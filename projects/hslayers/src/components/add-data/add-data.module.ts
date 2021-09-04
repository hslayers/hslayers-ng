import {
  CUSTOM_ELEMENTS_SCHEMA,
  NO_ERRORS_SCHEMA,
  NgModule,
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {TranslateModule} from '@ngx-translate/core';

import {HsAddDataCatalogueModule} from './catalogue/add-data-catalogue.module';
import {HsAddDataComponent} from './add-data.component';
import {HsAddDataFileModule} from './file/add-data-file.module';
import {HsAddDataUrlModule} from './url/add-data-url.module';
import {HsPanelHelpersModule} from '../layout/panels/panel-helpers.module';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
  declarations: [HsAddDataComponent],
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    HsPanelHelpersModule,
    HsAddDataUrlModule,
    HsAddDataFileModule,
    HsAddDataCatalogueModule,
  ],
  exports: [HsAddDataComponent],
  entryComponents: [HsAddDataComponent],
})
export class HsAddDataModule {}
