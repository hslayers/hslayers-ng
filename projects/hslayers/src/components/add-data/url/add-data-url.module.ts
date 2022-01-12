import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

import {TranslateModule} from '@ngx-translate/core';

import {HsAddDataUrlComponent} from './add-data-url.component';
import {HsAddDataVectorModule} from '../vector/vector.module';
import {HsUrlArcGisModule} from './arcgis/arcgis.module';
import {HsUrlWfsModule} from './wfs/wfs.module';
import {HsUrlWmsModule} from './wms/wms.module';
import {HsUrlWmtsModule} from './wmts/wmts.module';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [HsAddDataUrlComponent],
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    //
    HsUrlWmsModule,
    HsUrlArcGisModule,
    HsUrlWfsModule,
    HsAddDataVectorModule,
    HsUrlWmtsModule,
  ],
  exports: [HsAddDataUrlComponent],
})
export class HsAddDataUrlModule {}
