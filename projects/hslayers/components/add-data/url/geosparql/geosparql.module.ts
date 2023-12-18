import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {NgModule} from '@angular/core';

import {HsAddDataCommonModule} from '../../common/common.module';
import {HsAddToMapButtonComponent} from '../../../../common/add-to-map/add-to-map.component';
import {HsCommonUrlModule} from '../../common/url/url.module';
import {TranslateCustomPipe} from '../../../language/translate-custom.pipe';
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
