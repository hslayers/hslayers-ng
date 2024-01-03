import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

import {HsAddDataCommonModule} from '../../common/common.module';
import {HsCommonUrlModule} from '../../common/url/url.module';
import {TranslateCustomPipe} from 'hslayers-ng/components/language';
import {HsUiExtensionsModule} from 'hslayers-ng/common/widgets';
import {HsUrlWfsComponent} from './wfs.component';

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
  exports: [HsUrlWfsComponent],
  declarations: [HsUrlWfsComponent],
})
export class HsUrlWfsModule {}
