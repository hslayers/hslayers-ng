import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

import {HsAddDataCatalogueModule} from './catalogue/catalogue.module';
import {HsAddDataComponent} from './add-data.component';
import {HsAddDataFileModule} from './file/file.module';
import {HsAddDataUrlModule} from './url/add-data-url.module';
import {HsLanguageModule} from '../language/language.module';
import {HsPanelHelpersModule} from '../layout/panels/panel-helpers.module';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [HsAddDataComponent],
  imports: [
    CommonModule,
    FormsModule,
    HsLanguageModule,
    HsPanelHelpersModule,
    HsAddDataUrlModule,
    HsAddDataFileModule,
    HsAddDataCatalogueModule,
  ],
  exports: [HsAddDataComponent],
})
export class HsAddDataModule {}
