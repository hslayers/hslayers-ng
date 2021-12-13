import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {HsLaymanModule} from '../../common/layman/layman.module';
import {HsLogModule} from '../../common/log/log.module';
import {HsPanelHelpersModule} from '../layout/panels/panel-helpers.module';
import {HsSaveMapAdvancedFormComponent} from './save-map-advanced-form.component';
import {HsSaveMapComponent} from './save-map.component';
import {HsSaveMapDialogComponent} from './save-map-dialog.component';
import {HsSaveMapResultDialogComponent} from './save-map.result-dialog.component';
import {HsSaveMapSimpleFormComponent} from './save-map-simple-form.component';
import {HsUiExtensionsModule} from '../../common/widgets/ui-extensions.module';
import {TranslateModule} from '@ngx-translate/core';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [
    HsSaveMapComponent,
    HsSaveMapResultDialogComponent,
    HsSaveMapSimpleFormComponent,
    HsSaveMapDialogComponent,
    HsSaveMapAdvancedFormComponent,
  ],
  imports: [
    CommonModule,
    HsPanelHelpersModule,
    FormsModule,
    HsLogModule,
    HsUiExtensionsModule,
    TranslateModule,
    HsLaymanModule,
  ],
  exports: [HsSaveMapComponent],
})
export class HsSaveMapModule {}
