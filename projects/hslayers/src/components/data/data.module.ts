import {
  CUSTOM_ELEMENTS_SCHEMA,
  NO_ERRORS_SCHEMA,
  NgModule,
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {HsDataComponent} from './data.component';
import {HsPanelHelpersModule} from '../layout/panels/panel-helpers.module';
import {TranslateModule} from '@ngx-translate/core';

import {HsDataCatalogueModule} from './catalogue/data-catalogue-module';
import {HsDataFileModule} from './file/data-file.module';
import {HsDataService} from './data.service';
import {HsDataUrlModule} from './url/data-url.module';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
  declarations: [HsDataComponent],
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    HsPanelHelpersModule,
    HsDataUrlModule,
    HsDataFileModule,
    HsDataCatalogueModule,
  ],
  exports: [HsDataComponent],
  providers: [HsDataService],
  entryComponents: [HsDataComponent],
})
export class HsDataModule {}
