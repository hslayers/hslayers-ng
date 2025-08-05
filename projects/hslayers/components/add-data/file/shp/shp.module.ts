import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {TranslatePipe} from '@ngx-translate/core';

import {HsAddDataCommonModule} from '../../common/common.module';
import {HsFileShpComponent} from './shp.component';
import {HsUploadModule} from 'hslayers-ng/common/upload';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe,
    HsUploadModule,
    HsAddDataCommonModule,
  ],
  exports: [HsFileShpComponent],
  declarations: [HsFileShpComponent],
})
export class HsFileShpModule {}
