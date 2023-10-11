import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

import {HsLanguageModule} from '../language/language.module';
import {HsLaymanModule} from '../../common/layman/layman.module';
import {HsLogModule} from '../../common/log/log.module';
import {HsPanelHelpersModule} from '../layout/panels/panel-helpers.module';
import {HsSaveMapAdvancedFormComponent} from './form/form.component';
import {HsSaveMapComponent} from './save-map.component';
import {HsSaveMapDialogComponent} from './dialog-save/dialog-save.component';
import {HsSaveMapResultDialogComponent} from './dialog-result/dialog-result.component';
import {HsUiExtensionsModule} from '../../common/widgets/ui-extensions.module';
import { AdvancedOptionsComponent } from './form/advanced-options/advanced-options.component';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [
    HsSaveMapComponent,
    HsSaveMapResultDialogComponent,
    HsSaveMapDialogComponent,
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
    HsLanguageModule,
    HsLaymanModule,
  ],
  exports: [HsSaveMapComponent],
})
export class HsSaveMapModule {}
