import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

import {HsAddDataCommonModule} from '../../common/common.module';
import {HsCommonUrlModule} from '../../common/url/url.module';
import {HsLanguageModule} from '../../../language/language.module';
import {HsUiExtensionsModule} from '../../../../common/widgets/ui-extensions.module';
import {HsUrlWmtsComponent} from './wmts.component';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    FormsModule,
    HsLanguageModule,
    HsAddDataCommonModule,
    HsUiExtensionsModule,
    HsCommonUrlModule,
  ],
  exports: [HsUrlWmtsComponent],
  declarations: [HsUrlWmtsComponent],
})
export class HsUrlWmtsModule {}
