import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {TranslateModule} from '@ngx-translate/core';

import {HsAddDataCommonModule} from '../../common/addData-common.module';
import {HsAddDataWfsComponent} from './addData-url-wfs.component';
import {HsAddDataWfsService} from './addData-url-wfs.service';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, FormsModule, TranslateModule, HsAddDataCommonModule],
  exports: [HsAddDataWfsComponent],
  declarations: [HsAddDataWfsComponent],
  providers: [HsAddDataWfsService],
})
export class HsAddDataWfsModule {}
