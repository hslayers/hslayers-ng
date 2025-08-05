import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {TranslatePipe} from '@ngx-translate/core';

import {HsAddDataComponent} from './add-data.component';
import {HsAddDataFileModule} from './file/file.module';
import {HsAddDataUrlModule} from './url/add-data-url.module';
import {
  HsPanelHeaderComponent,
  HsPanelHelpersModule,
} from 'hslayers-ng/common/panels';
import {HsAddDataCatalogueComponent} from './catalogue/catalogue.component';
import {HsUrlXyzService} from 'hslayers-ng/services/add-data';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [HsAddDataComponent],
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe,
    HsPanelHelpersModule,
    HsAddDataUrlModule,
    HsAddDataFileModule,
    HsAddDataCatalogueComponent,
    HsPanelHeaderComponent,
  ],
  providers: [HsUrlXyzService],
  exports: [HsAddDataComponent],
})
export class HsAddDataModule {}
