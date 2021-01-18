import {
  CUSTOM_ELEMENTS_SCHEMA,
  NO_ERRORS_SCHEMA,
  NgModule,
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {HsAddDataArcGisModule} from './arcgis/addData-url-arcgis.module';
import {HsAddDataUrlComponent} from './addData-url.component';
import {HsAddDataUrlWmsModule} from './wms/addData-url-wms.module';
import {HsAddDataVectorModule} from '../vector/addData-vector.module';
import {HsAddDataWfsModule} from './wfs/addData-url-wfs.module';
import {TranslateModule} from '@ngx-translate/core';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
  declarations: [HsAddDataUrlComponent],
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    //
    HsAddDataUrlWmsModule,
    HsAddDataArcGisModule,
    HsAddDataWfsModule,
    HsAddDataVectorModule,
  ],
  exports: [HsAddDataUrlComponent],
  providers: [],
  entryComponents: [HsAddDataUrlComponent],
})
export class HsAddDataUrlModule {}
