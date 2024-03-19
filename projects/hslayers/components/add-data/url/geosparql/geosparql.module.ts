import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {NgModule} from '@angular/core';

import {HsAddDataCommonModule} from '../../common/common.module';
import {HsAddToMapButtonComponent} from 'hslayers-ng/common/add-to-map';
import {HsCommonUrlModule} from '../../common/url/url.module';
import {TranslateCustomPipe} from 'hslayers-ng/services/language';
import {HsUrlGeoSparqlComponent} from './geosparql.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    HsAddDataCommonModule,
    HsCommonUrlModule,
    TranslateCustomPipe,
    HsAddToMapButtonComponent,
  ],
  exports: [HsUrlGeoSparqlComponent],
  declarations: [HsUrlGeoSparqlComponent],
})
export class HsUrlGeoSparqlModule {}
