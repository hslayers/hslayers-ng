import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {TranslateModule} from '@ngx-translate/core';

import {HsAddDataCommonModule} from '../../common/add-data-common.module';
import {HsAddDataFileShpComponent} from './add-data-file-shp.component';
import {HsLaymanModule} from '../../../../common/layman/layman.module';
import {HsUiExtensionsModule} from '../../../../common/widgets/ui-extensions.module';
import {HsUploadModule} from '../../../../common/upload/upload.module';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    HsUiExtensionsModule,
    HsUploadModule,
    HsAddDataCommonModule,
    HsLaymanModule,
  ],
  exports: [HsAddDataFileShpComponent],
  declarations: [HsAddDataFileShpComponent],
})
export class HsAddDataFileShpModule {}
