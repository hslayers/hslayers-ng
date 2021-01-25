import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {TranslateModule} from '@ngx-translate/core';

import {HsAddDataCommonModule} from '../../common/add-data-common.module';
import {HsAddDataWfsComponent} from './add-data-url-wfs.component';
import {HsAddDataWfsService} from './add-data-url-wfs.service';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, FormsModule, TranslateModule, HsAddDataCommonModule],
  exports: [HsAddDataWfsComponent],
  declarations: [HsAddDataWfsComponent],
  providers: [HsAddDataWfsService],
})
export class HsAddDataWfsModule {}
