import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

import {TranslateModule} from '@ngx-translate/core';

import {
  BASE_DATA_TYPE,
  TYPE_CAPABILITIES_SERVICE,
  TYPE_SERVICE,
} from './injection-tokens.type';
import {HsAddDataUrlBaseComponent} from './add-data-url-base.component';
import {HsAddDataUrlComponent} from './add-data-url.component';
import {HsAddDataVectorModule} from '../vector/vector.module';
import {HsUrlArcGisModule} from './arcgis/arcgis.module';
import {HsUrlWfsModule} from './wfs/wfs.module';
import {HsUrlWmsModule} from './wms/wms.module';
import {HsUrlWmtsModule} from './wmts/wmts.module';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [HsAddDataUrlComponent, HsAddDataUrlBaseComponent],
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
  providers: [
    {provide: BASE_DATA_TYPE, useValue: ''},
    {provide: TYPE_SERVICE, useValue: null},
    {provide: TYPE_CAPABILITIES_SERVICE, useValue: null},
  ],
  exports: [HsAddDataUrlComponent, HsAddDataUrlBaseComponent],
  entryComponents: [HsAddDataUrlComponent],
})
export class HsAddDataUrlModule {}
