import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

import {HsAddDataCommonModule} from '../../common/common.module';
import {HsCommonUrlModule} from '../../common/url/url.module';
import {HsLayerTableComponent} from 'hslayers-ng/common/layer-table';
import {HsUrlWmtsComponent} from './wmts.component';
import {TranslateCustomPipe} from 'hslayers-ng/shared/language';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    FormsModule,
    TranslateCustomPipe,
    HsAddDataCommonModule,
    HsCommonUrlModule,
    HsLayerTableComponent,
  ],
  exports: [HsUrlWmtsComponent],
  declarations: [HsUrlWmtsComponent],
})
export class HsUrlWmtsModule {}