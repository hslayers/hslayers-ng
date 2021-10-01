import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {NgModule} from '@angular/core';
import {TranslateModule} from '@ngx-translate/core';

import {HsAddDataTargetPositionComponent} from './add-data-target-position/add-data-target-position.component';
import {HsAdvancedOptionsComponent} from './advanced-options/advanced-options.component';
import {HsGetCapabilitiesErrorComponent} from './capabilities-error-dialog/capabilities-error-dialog.component';
import {HsNewLayerFormComponent} from './new-layer-form/new-layer-form.component';
import {HsSaveToLaymanComponent} from './save-to-layman/save-to-layman.component';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, FormsModule, TranslateModule],
  exports: [
    HsGetCapabilitiesErrorComponent,
    HsAdvancedOptionsComponent,
    HsSaveToLaymanComponent,
    HsNewLayerFormComponent,
    HsAddDataTargetPositionComponent,
  ],
  declarations: [
    HsGetCapabilitiesErrorComponent,
    HsAdvancedOptionsComponent,
    HsSaveToLaymanComponent,
    HsNewLayerFormComponent,
    HsAddDataTargetPositionComponent,
  ],
  entryComponents: [HsGetCapabilitiesErrorComponent],
})
export class HsAddDataCommonComponentsModule {}
