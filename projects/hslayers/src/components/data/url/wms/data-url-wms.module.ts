import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {TranslateModule} from '@ngx-translate/core';

import {HsDataCommonModule} from '../../common/data-common.module';
import {HsDataUrlWmsService} from './data-url-wms.service';
import {HsDataWmsComponent} from './data-url-wms.component';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, FormsModule, TranslateModule, HsDataCommonModule],
  exports: [HsDataWmsComponent],
  declarations: [HsDataWmsComponent],
  providers: [HsDataUrlWmsService],
})
export class HsDataUrlWmsModule {}
