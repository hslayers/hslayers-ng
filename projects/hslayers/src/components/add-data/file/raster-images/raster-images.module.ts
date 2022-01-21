import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {NgModule} from '@angular/core';

import {TranslateModule} from '@ngx-translate/core';

import {HsAddDataCommonModule} from '../../common/common.module';
import {HsCommonUrlModule} from '../../common/url/url.module';
import {HsRasterImagesComponent} from './raster-images.component';
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
  exports: [HsRasterImagesComponent],
  declarations: [HsRasterImagesComponent],
  providers: [],
})
export class HsRasterImagesModule {}
