import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {NgModule} from '@angular/core';
import {TranslateModule} from '@ngx-translate/core';

import {HsAddDataCommonVectorFileUploadDirective} from './add-data-common-vector-file-upload.directive';
import {HsAddDataTargetPositionComponent} from './add-data-target-position.component';
import {HsAddDataUrlComponent} from './add-data-url.component';
import {HsGetCapabilitiesErrorComponent} from './capabilities-error-dialog.component';
import {HsHistoryListModule} from '../../../common/history-list/history-list.module';
import {HsNestedLayersTableComponent} from './nested-layers-table.component';
import {WmsLayerHighlightDirective} from './add-data-wms-layer-highlight-directive';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, FormsModule, TranslateModule, HsHistoryListModule],
  exports: [
    HsAddDataUrlComponent,
    HsAddDataTargetPositionComponent,
    HsGetCapabilitiesErrorComponent,
    HsNestedLayersTableComponent,
    HsAddDataCommonVectorFileUploadDirective,
    WmsLayerHighlightDirective,
  ],
  declarations: [
    HsAddDataUrlComponent,
    HsAddDataTargetPositionComponent,
    HsGetCapabilitiesErrorComponent,
    HsNestedLayersTableComponent,
    HsAddDataCommonVectorFileUploadDirective,
    WmsLayerHighlightDirective,
  ],
  providers: [],
  entryComponents: [HsGetCapabilitiesErrorComponent],
})
export class HsAddDataCommonModule {}
