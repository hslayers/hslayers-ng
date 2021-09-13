import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

import {TranslateModule} from '@ngx-translate/core';

import {HsAddDataArcGisModule} from './arcgis/add-data-url-arcgis.module';
import {HsAddDataUrlComponent} from './add-data-url.component';
import {HsAddDataUrlWmsModule} from './wms/add-data-url-wms.module';
import {HsAddDataVectorModule} from '../vector/add-data-vector.module';
import {HsAddDataWfsModule} from './wfs/add-data-url-wfs.module';
import {HsAddDataWmtsModule} from './wmts/add-data-url-wmts.module';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
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
  entryComponents: [HsAddDataUrlComponent],
})
export class HsAddDataUrlModule {}
