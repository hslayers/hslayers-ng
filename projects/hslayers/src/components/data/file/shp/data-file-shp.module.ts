import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {TranslateModule} from '@ngx-translate/core';

import {HsDataCommonModule} from '../../common/data-common.module';
import {HsDataFileShpComponent} from './data-file-shp.component';
import {HsDataFileShpService} from './data-file-shp.service';
import {HsUiExtensionsModule} from '../../../../common/widgets/ui-extensions.module';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    HsUiExtensionsModule,
    HsDataCommonModule,
  ],
  exports: [HsDataFileShpComponent],
  declarations: [HsDataFileShpComponent],
  providers: [HsDataFileShpService],
})
export class HsDataFileShpModule {}
