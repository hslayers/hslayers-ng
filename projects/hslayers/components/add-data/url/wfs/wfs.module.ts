import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

import {HsAddDataCommonModule} from '../../common/common.module';
import {HsCommonUrlModule} from '../../common/url/url.module';
import {HsLayerTableComponent} from 'hslayers-ng/common/layer-table';
import {HsUrlWfsComponent} from './wfs.component';
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
  exports: [HsUrlWfsComponent],
  declarations: [HsUrlWfsComponent],
})
export class HsUrlWfsModule {}
