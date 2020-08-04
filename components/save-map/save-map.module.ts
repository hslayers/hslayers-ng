import {BrowserModule} from '@angular/platform-browser';
import {
  CUSTOM_ELEMENTS_SCHEMA,
  NO_ERRORS_SCHEMA,
  NgModule,
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {HsLayerSynchronizerService} from './layer-synchronizer.service';
import {HsLaymanService} from './layman.service';
import {HsPanelHelpersModule} from '../layout/panel-helpers.module';
import {HsSaveMapAdvancedFormComponent} from './save-map-advanced-form.component';
import {HsSaveMapComponent} from './save-map.component';
import {HsSaveMapDialogComponent} from './save-map-dialog.component';
import {HsSaveMapManagerService} from './save-map-manager.service';
import {HsSaveMapResultDialogComponent} from './save-map.result-dialog.component';
import {HsSaveMapService} from './save-map.service';
import {HsSaveMapSimpleFormComponent} from './save-map-simple-form.component';
import {HsStatusManagerService} from './status-manager.service';
import {HsSyncErrorDialogComponent} from './sync-error-dialog.component';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';

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
  imports: [CommonModule, BrowserModule, NgbModule, HsPanelHelpersModule],
  exports: [HsSaveMapComponent],
  providers: [
    HsSaveMapManagerService,
    HsSaveMapService,
    HsStatusManagerService,
    HsLaymanService,
    HsLayerSynchronizerService,
  ],
  entryComponents: [HsSaveMapComponent],
})
export class HsSaveMapModule {}
