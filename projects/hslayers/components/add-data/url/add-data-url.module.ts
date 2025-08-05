import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {TranslatePipe} from '@ngx-translate/core';

import {HsAddDataUrlComponent} from './add-data-url.component';
import {HsAddDataVectorModule} from '../vector/vector.module';
import {HsUrlArcGisModule} from './arcgis/arcgis.module';
import {HsUrlGeoSparqlModule} from './geosparql/geosparql.module';
import {HsUrlWfsModule} from './wfs/wfs.module';
import {HsUrlWmsModule} from './wms/wms.module';
import {HsUrlWmtsModule} from './wmts/wmts.module';
import {HsUrlXyzModule} from './xyz/xyz.module';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [HsAddDataUrlComponent],
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe,
    HsAddDataVectorModule,
    HsUrlArcGisModule,
    HsUrlGeoSparqlModule,
    HsUrlWfsModule,
    HsUrlWmsModule,
    HsUrlWmtsModule,
    HsUrlXyzModule,
  ],
  exports: [HsAddDataUrlComponent],
})
export class HsAddDataUrlModule {}
