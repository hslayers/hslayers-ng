import {
  CUSTOM_ELEMENTS_SCHEMA,
  NO_ERRORS_SCHEMA,
  NgModule,
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {HsAddDataComponent} from './add-data.component';
import {HsPanelHelpersModule} from '../layout/panels/panel-helpers.module';
import {TranslateModule} from '@ngx-translate/core';

import {HsAddDataCatalogueModule} from './catalogue/add-data-catalogue-module';
import {HsAddDataFileModule} from './file/add-data-file.module';
import {HsAddDataService} from './add-data.service';
import {HsAddDataUrlModule} from './url/add-data-url.module';

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
  providers: [HsAddDataService],
  entryComponents: [HsAddDataComponent],
})
export class HsAddDataModule {}
