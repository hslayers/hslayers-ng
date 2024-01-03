import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {NgModule} from '@angular/core';
import {NgbProgressbarModule} from '@ng-bootstrap/ng-bootstrap';

import {HsAddLayerAuthorizedComponent} from './add-layer-authorized/add-layer-authorized.component';
import {HsAddToMapButtonComponent} from 'hslayers-ng/common/add-to-map';
import {HsAdvancedOptionsComponent} from './advanced-options/advanced-options.component';
import {HsGetCapabilitiesErrorComponent} from './capabilities-error-dialog/capabilities-error-dialog.component';
import {HsLaymanModule} from 'hslayers-ng/common/layman';
import {HsNewLayerFormComponent} from './new-layer-form/new-layer-form.component';
import {HsPositionComponent} from './target-position/target-position.component';
import {HsSaveToLaymanComponent} from './save-to-layman/save-to-layman.component';
import {HsUiExtensionsModule} from 'hslayers-ng/common/widgets';
import {TranslateCustomPipe} from 'hslayers-ng/components/language';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    FormsModule,
    TranslateCustomPipe,
    HsLaymanModule,
    HsUiExtensionsModule,
    NgbProgressbarModule,
    HsAddToMapButtonComponent,
  ],
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
