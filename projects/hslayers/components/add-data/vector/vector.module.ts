import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {TranslatePipe} from '@ngx-translate/core';

import {HsAddDataCommonModule} from '../common/common.module';
import {HsAddDataVectorFileComponent} from './vector-file/vector-file.component';
import {HsAddDataVectorUrlComponent} from './vector-url/vector-url.component';
import {HsAddToMapButtonComponent} from 'hslayers-ng/common/add-to-map';
import {HsCommonUrlModule} from '../common/url/url.module';
import {HsLaymanCurrentUserComponent} from 'hslayers-ng/common/layman';
import {HsUploadModule} from 'hslayers-ng/common/upload';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe,
    HsAddDataCommonModule,
    HsCommonUrlModule,
    HsLaymanCurrentUserComponent,
    HsUploadModule,
    HsAddToMapButtonComponent,
  ],
  exports: [HsAddDataVectorFileComponent, HsAddDataVectorUrlComponent],
  declarations: [HsAddDataVectorFileComponent, HsAddDataVectorUrlComponent],
})
export class HsAddDataVectorModule {}
