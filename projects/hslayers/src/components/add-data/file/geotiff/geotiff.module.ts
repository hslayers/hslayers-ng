import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {NgModule} from '@angular/core';

import {TranslateModule} from '@ngx-translate/core';

import {HsAddDataCommonModule} from '../../common/common.module';
import {HsCommonUrlModule} from '../../common/url/url.module';
import {HsFileGeotiffComponent} from './geotiff.component';
import {HsUploadModule} from '../../../../common/upload/upload.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    HsAddDataCommonModule,
    HsCommonUrlModule,
    TranslateModule,
    HsUploadModule,
  ],
  exports: [HsFileGeotiffComponent],
  declarations: [HsFileGeotiffComponent],
  providers: [],
})
export class HsAddDataGeotiffModule {}
