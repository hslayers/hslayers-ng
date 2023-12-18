import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

import {AdvancedOptionsComponent} from './form/advanced-options/advanced-options.component';
import {HsLaymanModule} from '../../common/layman/layman.module';
import {HsLogModule} from '../../common/log/log.module';
import {HsPanelHeaderComponent} from '../layout/panels/panel-header/panel-header.component';
import {HsPanelHelpersModule} from '../layout/panels/panel-helpers.module';
import {HsSaveMapAdvancedFormComponent} from './form/form.component';
import {HsSaveMapComponent} from './save-map.component';
import {HsSaveMapResultDialogComponent} from './dialog-result/dialog-result.component';
import {HsUiExtensionsModule} from '../../common/widgets/ui-extensions.module';
import {TranslateCustomPipe} from '../language/translate-custom.pipe';

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
    HsLogModule,
    HsUiExtensionsModule,
    TranslateCustomPipe,
    HsLaymanModule,
    HsPanelHeaderComponent,
  ],
  exports: [HsSaveMapComponent],
})
export class HsSaveMapModule {}
