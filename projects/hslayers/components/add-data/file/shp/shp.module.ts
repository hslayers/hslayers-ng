import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

import {HsAddDataCommonModule} from '../../common/common.module';
import {HsFileShpComponent} from './shp.component';
import {TranslateCustomPipe} from 'hslayers-ng/components/language';
import {HsUploadModule} from 'hslayers-ng/common/upload';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    FormsModule,
    TranslateCustomPipe,
    HsUploadModule,
    HsAddDataCommonModule,
  ],
  exports: [HsFileShpComponent],
  declarations: [HsFileShpComponent],
})
export class HsFileShpModule {}
