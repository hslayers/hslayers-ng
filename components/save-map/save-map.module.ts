import {
  CUSTOM_ELEMENTS_SCHEMA,
  NO_ERRORS_SCHEMA,
  NgModule,
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {HsLayerSynchronizerService} from './layer-synchronizer.service';
import {HsLaymanModule} from '../../common/layman/layman.module';
import {HsLaymanService} from './layman.service';
import {HsLogModule} from '../../common/log/log.module';
import {HsPanelHelpersModule} from '../layout/panels/panel-helpers.module';
import {HsSaveMapAdvancedFormComponent} from './save-map-advanced-form.component';
import {HsSaveMapComponent} from './save-map.component';
import {HsSaveMapDialogComponent} from './save-map-dialog.component';
import {HsSaveMapDialogSpawnerService} from './dialog-spawner.service';
import {HsSaveMapManagerService} from './save-map-manager.service';
import {HsSaveMapResultDialogComponent} from './save-map.result-dialog.component';
import {HsSaveMapService} from './save-map.service';
import {HsSaveMapSimpleFormComponent} from './save-map-simple-form.component';
import {HsStatusManagerService} from './status-manager.service';
import {HsSyncErrorDialogComponent} from './sync-error-dialog.component';
import {HsUiExtensionsModule} from '../../common/widgets/ui-extensions.module';
import {TranslateModule} from '@ngx-translate/core';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
  declarations: [
    HsSaveMapComponent,
    HsSyncErrorDialogComponent,
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
  providers: [
    HsSaveMapManagerService,
    HsSaveMapService,
    HsStatusManagerService,
    HsLaymanService,
    HsLayerSynchronizerService,
    HsSaveMapDialogSpawnerService,
  ],
  entryComponents: [
    HsSaveMapComponent,
    HsSaveMapAdvancedFormComponent,
    HsSaveMapResultDialogComponent,
    HsSaveMapDialogComponent,
    HsSyncErrorDialogComponent,
  ],
})
export class HsSaveMapModule {}
