import {
  CUSTOM_ELEMENTS_SCHEMA,
  NO_ERRORS_SCHEMA,
  NgModule,
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {HsAddDataComponent} from './addData.component';
import {HsPanelHelpersModule} from '../layout/panels/panel-helpers.module';
import {TranslateModule} from '@ngx-translate/core';

import {HsAddDataCatalogueModule} from './catalogue/addData-catalogue-module';
import {HsAddDataFileModule} from './file/addData-file.module';
import {HsAddDataService} from './addData.service';
import {HsAddDataUrlModule} from './url/addData-url.module';

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
