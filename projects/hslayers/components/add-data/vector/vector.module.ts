import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

import {HsAddDataCommonModule} from '../common/common.module';
import {HsAddDataVectorFileComponent} from './vector-file/vector-file.component';
import {HsAddDataVectorUrlComponent} from './vector-url/vector-url.component';
import {HsAddToMapButtonComponent} from 'hslayers-ng/common/add-to-map';
import {HsCommonUrlModule} from '../common/url/url.module';
import {HsLaymanModule} from 'hslayers-ng/common/layman';
import {HsUploadModule} from 'hslayers-ng/common/upload';
import {TranslateCustomPipe} from 'hslayers-ng/components/language';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    FormsModule,
    TranslateCustomPipe,
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
