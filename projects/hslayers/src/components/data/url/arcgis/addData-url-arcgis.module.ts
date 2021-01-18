import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {TranslateModule} from '@ngx-translate/core';

import {HsAddDataArcGisComponent} from './addData-url-arcgis.component';
import {HsAddDataArcGisService} from './addData-url-arcgis.service';
import {HsAddDataCommonModule} from '../../common/addData-common.module';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, FormsModule, TranslateModule, HsAddDataCommonModule],
  exports: [HsAddDataArcGisComponent],
  declarations: [HsAddDataArcGisComponent],
  providers: [HsAddDataArcGisService],
})
export class HsAddDataArcGisModule {}
