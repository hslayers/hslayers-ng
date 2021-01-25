import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {TranslateModule} from '@ngx-translate/core';

import {HsAddDataArcGisComponent} from './add-data-url-arcgis.component';
import {HsAddDataArcGisService} from './add-data-url-arcgis.service';
import {HsAddDataCommonModule} from '../../common/add-data-common.module';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, FormsModule, TranslateModule, HsAddDataCommonModule],
  exports: [HsAddDataArcGisComponent],
  declarations: [HsAddDataArcGisComponent],
  providers: [HsAddDataArcGisService],
})
export class HsAddDataArcGisModule {}
