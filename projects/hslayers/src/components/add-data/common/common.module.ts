import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {NgModule} from '@angular/core';

import {TranslateModule} from '@ngx-translate/core';

import {HsAdvancedOptionsComponent} from './advanced-options/advanced-options.component';
import {HsGetCapabilitiesErrorComponent} from './capabilities-error-dialog/capabilities-error-dialog.component';
import {HsNewLayerFormComponent} from './new-layer-form/new-layer-form.component';
import {HsPositionComponent} from './target-position/target-position.component';
import {HsSaveToLaymanComponent} from './save-to-layman/save-to-layman.component';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, FormsModule, TranslateModule],
  exports: [
    HsGetCapabilitiesErrorComponent,
    HsAdvancedOptionsComponent,
    HsSaveToLaymanComponent,
    HsNewLayerFormComponent,
    HsPositionComponent,
  ],
  declarations: [
    HsGetCapabilitiesErrorComponent,
    HsAdvancedOptionsComponent,
    HsSaveToLaymanComponent,
    HsNewLayerFormComponent,
    HsPositionComponent,
  ],
  entryComponents: [HsGetCapabilitiesErrorComponent],
})
export class HsAddDataCommonModule {}
