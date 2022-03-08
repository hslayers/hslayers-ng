import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

import {HsAddDataCommonModule} from '../../common/common.module';
import {HsFileShpComponent} from './shp.component';
import {HsLanguageModule} from '../../../language/language.module';
import {HsUploadModule} from '../../../../common/upload/upload.module';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    FormsModule,
    HsLanguageModule,
    HsUploadModule,
    HsAddDataCommonModule,
  ],
  exports: [HsFileShpComponent],
  declarations: [HsFileShpComponent],
})
export class HsFileShpModule {}
