import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {NgModule} from '@angular/core';
import {TranslateModule} from '@ngx-translate/core';

import {HsAddLayersUrlComponent} from './add-layers-url.component';
import {HsGetCapabilitiesErrorComponent} from './capabilities-error-dialog.component';
import {HsHistoryListModule} from '../../../common/history-list/history-list.module';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, FormsModule, TranslateModule, HsHistoryListModule],
  exports: [HsAddLayersUrlComponent, HsGetCapabilitiesErrorComponent],
  declarations: [HsAddLayersUrlComponent, HsGetCapabilitiesErrorComponent],
  providers: [],
  entryComponents: [HsGetCapabilitiesErrorComponent],
})
export class HsAddLayersCommonModule {}
