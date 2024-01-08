import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

import {HsAddDataCatalogueModule} from './catalogue/catalogue.module';
import {HsAddDataComponent} from './add-data.component';
import {HsAddDataFileModule} from './file/file.module';
import {HsAddDataUrlModule} from './url/add-data-url.module';
import {HsPanelHeaderComponent} from 'hslayers-ng/common/panels';
import {HsPanelHelpersModule} from 'hslayers-ng/common/panels';
import {TranslateCustomPipe} from 'hslayers-ng/shared/language';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [HsAddDataComponent],
  imports: [
    CommonModule,
    FormsModule,
    TranslateCustomPipe,
    HsPanelHelpersModule,
    HsAddDataUrlModule,
    HsAddDataFileModule,
    HsAddDataCatalogueModule,
    HsPanelHeaderComponent,
  ],
  exports: [HsAddDataComponent],
})
export class HsAddDataModule {}
