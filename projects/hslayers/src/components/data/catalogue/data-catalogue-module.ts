import {
  CUSTOM_ELEMENTS_SCHEMA,
  NO_ERRORS_SCHEMA,
  NgModule,
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {HsDataCatalogueComponent} from './data-catalogue.component';
import {TranslateModule} from '@ngx-translate/core';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
  declarations: [HsDataCatalogueComponent],
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    //
  ],
  exports: [HsDataCatalogueComponent],
  providers: [],
  entryComponents: [HsDataCatalogueComponent],
})
export class HsDataCatalogueModule {}
