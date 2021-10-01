import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {TranslateModule} from '@ngx-translate/core';

import {NgbProgressbarModule} from '@ng-bootstrap/ng-bootstrap';

import {HsAddDataCommonComponentsModule} from '../../common/common-components/common-components.module';
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
    HsAddDataCommonComponentsModule,
    HsLaymanModule,
    NgbProgressbarModule,
  ],
  exports: [HsAddDataFileShpComponent],
  declarations: [HsAddDataFileShpComponent],
})
export class HsAddDataFileShpModule {}
