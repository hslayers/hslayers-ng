import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {NgModule} from '@angular/core';
import {TranslateModule} from '@ngx-translate/core';

import {HsAddDataCommonUrlComponent} from './add-data-common-url/add-data-common-url.component';
import {HsAddDataTargetPositionComponent} from './add-data-target-position/add-data-target-position.component';
import {HsCommonUrlAddComponent} from './common-url-add/common-url-add.component';
import {HsCommonUrlProgressComponent} from './common-url-progress/common-url-progress.component';
import {HsCommonUrlDetailsComponent} from './common-url-details/common-url-details.component';
import {HsGetCapabilitiesErrorComponent} from './capabilities-error-dialog/capabilities-error-dialog.component';
import {HsHistoryListModule} from '../../../common/history-list/history-list.module';
import {HsNestedLayersTableComponent} from './nested-layers-table/nested-layers-table.component';
import {HsUiExtensionsModule} from '../../../common/widgets/ui-extensions.module';
import {WmsLayerHighlightDirective} from './add-data-wms-layer-highlight-directive';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    HsHistoryListModule,
    HsUiExtensionsModule,
  ],
  exports: [
    HsCommonUrlAddComponent,
    HsCommonUrlProgressComponent,
    HsAddDataCommonUrlComponent,
    HsAddDataTargetPositionComponent,
    HsGetCapabilitiesErrorComponent,
    HsNestedLayersTableComponent,
    WmsLayerHighlightDirective,
    HsCommonUrlDetailsComponent,
  ],
  declarations: [
    HsCommonUrlAddComponent,
    HsCommonUrlDetailsComponent,
    HsAddDataCommonUrlComponent,
    HsAddDataTargetPositionComponent,
    HsGetCapabilitiesErrorComponent,
    HsNestedLayersTableComponent,
    WmsLayerHighlightDirective,
    HsCommonUrlProgressComponent,
  ],
  entryComponents: [HsGetCapabilitiesErrorComponent],
})
export class HsAddDataCommonModule {}
