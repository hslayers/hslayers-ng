import {
  CUSTOM_ELEMENTS_SCHEMA,
  NO_ERRORS_SCHEMA,
  NgModule,
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {HsAddDataArcGisModule} from './arcgis/add-data-url-arcgis.module';
import {HsAddDataUrlComponent} from './add-data-url.component';
import {HsAddDataUrlService} from './add-data-url.service';
import {HsAddDataUrlWmsModule} from './wms/add-data-url-wms.module';
import {HsAddDataVectorModule} from '../vector/add-data-vector.module';
import {HsAddDataWfsModule} from './wfs/add-data-url-wfs.module';
import {HsAddDataWmtsModule} from './wmts/add-data-url-wmts.module';
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
    HsAddDataWmtsModule,
  ],
  exports: [HsAddDataUrlComponent],
  providers: [HsAddDataUrlService],
  entryComponents: [HsAddDataUrlComponent],
})
export class HsAddDataUrlModule {}
