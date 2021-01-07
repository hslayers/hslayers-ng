import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {TranslateModule} from '@ngx-translate/core';

import {HsDataCommonModule} from '../../common/data-common.module';
import {HsDataWfsComponent} from './data-url-wfs.component';
import {HsDataWfsService} from './data-url-wfs.service';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, FormsModule, TranslateModule, HsDataCommonModule],
  exports: [HsDataWfsComponent],
  declarations: [HsDataWfsComponent],
  providers: [HsDataWfsService],
})
export class HsDataWfsModule {}
