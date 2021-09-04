import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {TranslateModule} from '@ngx-translate/core';

import {HsAddDataCommonModule} from '../common/add-data-common.module';
import {HsAddDataVectorComponent} from './add-data-vector.component';
import {HsLaymanModule} from '../../../common/layman/layman.module';
import {HsUploadModule} from '../../../common/upload/upload.module';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    HsAddDataCommonModule,
    HsLaymanModule,
    HsUploadModule,
  ],
  exports: [HsAddDataVectorComponent],
  declarations: [HsAddDataVectorComponent],
})
export class HsAddDataVectorModule {}
