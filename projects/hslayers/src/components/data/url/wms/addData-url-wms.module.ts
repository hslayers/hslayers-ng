import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {TranslateModule} from '@ngx-translate/core';

import {HsAddDataCommonModule} from '../../common/addData-common.module';
import {HsAddDataUrlWmsService} from './addData-url-wms.service';
import {HsAddDataWmsComponent} from './addData-url-wms.component';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, FormsModule, TranslateModule, HsAddDataCommonModule],
  exports: [HsAddDataWmsComponent],
  declarations: [HsAddDataWmsComponent],
  providers: [HsAddDataUrlWmsService],
})
export class HsAddDataUrlWmsModule {}
