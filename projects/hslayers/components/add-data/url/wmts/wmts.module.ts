import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

import {HsAddDataCommonModule} from '../../common/common.module';
import {HsCommonUrlModule} from '../../common/url/url.module';
import {HsUiExtensionsModule} from 'hslayers-ng/common/widgets';
import {HsUrlWmtsComponent} from './wmts.component';
import {TranslateCustomPipe} from 'hslayers-ng/components/language';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    FormsModule,
    TranslateCustomPipe,
    HsAddDataCommonModule,
    HsUiExtensionsModule,
    HsCommonUrlModule,
  ],
  exports: [HsUrlWmtsComponent],
  declarations: [HsUrlWmtsComponent],
})
export class HsUrlWmtsModule {}
