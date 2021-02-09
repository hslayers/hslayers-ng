import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {TranslateModule} from '@ngx-translate/core';

import {HsAddDataCommonModule} from '../../common/add-data-common.module';
import {HsAddDataFileShpComponent} from './add-data-file-shp.component';
import {HsAddDataFileShpService} from './add-data-file-shp.service';
import {HsUiExtensionsModule} from '../../../../common/widgets/ui-extensions.module';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    HsUiExtensionsModule,
    HsAddDataCommonModule,
  ],
  exports: [HsAddDataFileShpComponent],
  declarations: [HsAddDataFileShpComponent],
  providers: [HsAddDataFileShpService],
})
export class HsAddDataFileShpModule {}
