import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

import {TranslateModule} from '@ngx-translate/core';

import {HsAddDataCommonModule} from '../common/common.module';
import {HsAddDataVectorFileComponent} from './vector-file/vector-file.component';
import {HsAddDataVectorUrlComponent} from './vector-url/vector-url.component';
import {HsCommonUrlModule} from '../common/url/url.module';
import {HsLaymanModule} from '../../../common/layman/layman.module';
import {HsUploadModule} from '../../../common/upload/upload.module';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    HsAddDataCommonModule,
    HsCommonUrlModule,
    HsLaymanModule,
    HsUploadModule,
  ],
  exports: [HsAddDataVectorFileComponent, HsAddDataVectorUrlComponent],
  declarations: [HsAddDataVectorFileComponent, HsAddDataVectorUrlComponent],
})
export class HsAddDataVectorModule {}
