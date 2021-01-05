import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {NgModule} from '@angular/core';
import {TranslateModule} from '@ngx-translate/core';

import {HsDataTargetPositionComponent} from './data-target-position.component';
import {HsDataUrlComponent} from './data-url.component';
import {HsGetCapabilitiesErrorComponent} from './capabilities-error-dialog.component';
import {HsHistoryListModule} from '../../../common/history-list/history-list.module';
import {HsNestedLayersTableComponent} from './nested-layers-table.component';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, FormsModule, TranslateModule, HsHistoryListModule],
  exports: [
    HsDataUrlComponent,
    HsDataTargetPositionComponent,
    HsGetCapabilitiesErrorComponent,
    HsNestedLayersTableComponent,
  ],
  declarations: [
    HsDataUrlComponent,
    HsDataTargetPositionComponent,
    HsGetCapabilitiesErrorComponent,
    HsNestedLayersTableComponent,
  ],
  providers: [],
  entryComponents: [HsGetCapabilitiesErrorComponent],
})
export class HsDataCommonModule {}
