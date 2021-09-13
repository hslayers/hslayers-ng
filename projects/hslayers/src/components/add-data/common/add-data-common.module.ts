import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {NgModule} from '@angular/core';
import {TranslateModule} from '@ngx-translate/core';

import {HsAddDataCommonUrlComponent} from './add-data-common-url/add-data-common-url.component';
import {HsAddDataTargetPositionComponent} from './add-data-target-position/add-data-target-position.component';
import {HsCommonUrlAddToMapComponent} from './common-url-add-to-map/common-url-add-to-map.component';
import {HsCommonUrlLoadingDataComponent} from './common-url-loading-data/common-url-loading-data.component';
import {HsCommonUrlShowDetailsComponent} from './common-url-show-details/common-url-show-details.component';
import {HsGetCapabilitiesErrorComponent} from './capabilities-error-dialog/capabilities-error-dialog.component';
import {HsHistoryListModule} from '../../../common/history-list/history-list.module';
import {HsNestedLayersTableComponent} from './nested-layers-table/nested-layers-table.component';
import {WmsLayerHighlightDirective} from './add-data-wms-layer-highlight-directive';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, FormsModule, TranslateModule, HsHistoryListModule],
  exports: [
    HsCommonUrlAddToMapComponent,
    HsCommonUrlLoadingDataComponent,
    HsAddDataCommonUrlComponent,
    HsAddDataTargetPositionComponent,
    HsGetCapabilitiesErrorComponent,
    HsNestedLayersTableComponent,
    WmsLayerHighlightDirective,
    HsCommonUrlShowDetailsComponent,
  ],
  declarations: [
    HsCommonUrlAddToMapComponent,
    HsCommonUrlShowDetailsComponent,
    HsAddDataCommonUrlComponent,
    HsAddDataTargetPositionComponent,
    HsGetCapabilitiesErrorComponent,
    HsNestedLayersTableComponent,
    WmsLayerHighlightDirective,
    HsCommonUrlLoadingDataComponent,
  ],
  entryComponents: [HsGetCapabilitiesErrorComponent],
})
export class HsAddDataCommonModule {}
