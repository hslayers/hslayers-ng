import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {TranslateModule} from '@ngx-translate/core';

import {HsAddDataCommonModule} from '../../common/addData-common.module';
import {HsAddDataUrlWmtsService} from './addData-url-wmts-service';
import {HsAddDataWmtsComponent} from './addData-url-wmts.component';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, FormsModule, TranslateModule, HsAddDataCommonModule],
  exports: [HsAddDataWmtsComponent],
  declarations: [HsAddDataWmtsComponent],
  providers: [HsAddDataUrlWmtsService],
})
export class HsAddDataWmtsModule {}
