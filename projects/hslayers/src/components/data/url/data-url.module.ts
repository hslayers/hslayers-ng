import {
  CUSTOM_ELEMENTS_SCHEMA,
  NO_ERRORS_SCHEMA,
  NgModule,
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {HsDataArcGisModule} from './arcgis/data-url-arcgis.module';
import {HsDataUrlComponent} from './data-url-component';
import {HsDataUrlWmsModule} from '../url/wms/data-url-wms.module';
import {TranslateModule} from '@ngx-translate/core';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
  declarations: [HsDataUrlComponent],
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    HsDataUrlWmsModule,
    HsDataArcGisModule,
  ],
  exports: [HsDataUrlComponent],
  providers: [],
  entryComponents: [HsDataUrlComponent],
})
export class HsDataUrlModule {}
