import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

import {AdvancedOptionsComponent} from './form/advanced-options/advanced-options.component';
import {HsLaymanModule} from 'hslayers-ng/common/layman';
import {HsPanelHeaderComponent} from 'hslayers-ng/common/panels';
import {HsPanelHelpersModule} from 'hslayers-ng/common/panels';
import {HsSaveMapAdvancedFormComponent} from './form/form.component';
import {HsSaveMapComponent} from './save-map.component';
import {HsSaveMapResultDialogComponent} from './dialog-result/dialog-result.component';
import {HsUiExtensionsModule} from 'hslayers-ng/common/widgets';
import {TranslateCustomPipe} from 'hslayers-ng/shared/language';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [
    HsSaveMapComponent,
    HsSaveMapResultDialogComponent,
    HsSaveMapAdvancedFormComponent,
    AdvancedOptionsComponent,
  ],
  imports: [
    CommonModule,
    HsPanelHelpersModule,
    FormsModule,
    ReactiveFormsModule,
    HsUiExtensionsModule,
    TranslateCustomPipe,
    HsLaymanModule,
    HsPanelHeaderComponent,
  ],
  exports: [HsSaveMapComponent],
})
export class HsSaveMapModule {}
