import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

import {HsAddDataCommonModule} from '../../common/common.module';
import {HsCommonUrlModule} from '../../common/url/url.module';
import {HsLayerTableComponent} from 'hslayers-ng/common/layer-table';
import {TranslateCustomPipe} from 'hslayers-ng/services/language';

import {HsUrlXyzComponent} from './xyz.component';
import {HsAddToMapButtonComponent} from 'hslayers-ng/common/add-to-map';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    FormsModule,
    TranslateCustomPipe,
    HsAddDataCommonModule,
    HsCommonUrlModule,
    HsLayerTableComponent,
    HsAddToMapButtonComponent,
  ],
  exports: [HsUrlXyzComponent],
  declarations: [HsUrlXyzComponent],
})
export class HsUrlXyzModule {}
