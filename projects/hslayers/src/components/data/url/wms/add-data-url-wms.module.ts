import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {TranslateModule} from '@ngx-translate/core';

import {HsAddDataCommonModule} from '../../common/add-data-common.module';
import {HsAddDataUrlWmsService} from './add-data-url-wms.service';
import {HsAddDataWmsComponent} from './add-data-url-wms.component';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, FormsModule, TranslateModule, HsAddDataCommonModule],
  exports: [HsAddDataWmsComponent],
  declarations: [HsAddDataWmsComponent],
  providers: [HsAddDataUrlWmsService],
})
export class HsAddDataUrlWmsModule {}
