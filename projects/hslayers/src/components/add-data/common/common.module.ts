import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {NgModule} from '@angular/core';

import {TranslateModule} from '@ngx-translate/core';

import {HsAddLayerAuthorizedComponent} from './add-layer-authorized/add-layer-authorized.component';
import {HsAdvancedOptionsComponent} from './advanced-options/advanced-options.component';
import {HsGetCapabilitiesErrorComponent} from './capabilities-error-dialog/capabilities-error-dialog.component';
import {HsLaymanModule} from '../../../common/layman/layman.module';
import {HsNewLayerFormComponent} from './new-layer-form/new-layer-form.component';
import {HsPositionComponent} from './target-position/target-position.component';
import {HsSaveToLaymanComponent} from './save-to-layman/save-to-layman.component';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, FormsModule, TranslateModule, HsLaymanModule],
  exports: [
    HsGetCapabilitiesErrorComponent,
    HsAdvancedOptionsComponent,
    HsSaveToLaymanComponent,
    HsNewLayerFormComponent,
    HsPositionComponent,
    HsAddLayerAuthorizedComponent,
  ],
  declarations: [
    HsGetCapabilitiesErrorComponent,
    HsAdvancedOptionsComponent,
    HsSaveToLaymanComponent,
    HsNewLayerFormComponent,
    HsPositionComponent,
    HsAddLayerAuthorizedComponent,
  ],
})
export class HsAddDataCommonModule {}
