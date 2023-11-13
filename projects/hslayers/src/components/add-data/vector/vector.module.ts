import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

import {HsAddDataCommonModule} from '../common/common.module';
import {HsAddDataVectorFileComponent} from './vector-file/vector-file.component';
import {HsAddDataVectorUrlComponent} from './vector-url/vector-url.component';
import {HsAddToMapButtonComponent} from '../../../common/add-to-map/add-to-map.component';
import {HsCommonUrlModule} from '../common/url/url.module';
import {HsLanguageModule} from '../../language/language.module';
import {HsLaymanModule} from '../../../common/layman/layman.module';
import {HsUploadModule} from '../../../common/upload/upload.module';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    FormsModule,
    HsLanguageModule,
    HsAddDataCommonModule,
    HsCommonUrlModule,
    HsLaymanModule,
    HsUploadModule,
    HsAddToMapButtonComponent,
  ],
  exports: [HsAddDataVectorFileComponent, HsAddDataVectorUrlComponent],
  declarations: [HsAddDataVectorFileComponent, HsAddDataVectorUrlComponent],
})
export class HsAddDataVectorModule {}
