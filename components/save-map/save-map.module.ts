import {BrowserModule} from '@angular/platform-browser';
import {
  CUSTOM_ELEMENTS_SCHEMA,
  NO_ERRORS_SCHEMA,
  NgModule,
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {HsLayerSynchronizerService} from './layer-synchronizer.service';
import {HsLaymanService} from './layman.service';
import {HsSaveMapComponent} from './save-map.component';
import {HsSaveMapManagerService} from './save-map-manager.service';
import {HsSaveMapService} from './save-map.service';
import {HsStatusManagerService} from './status-manager.service';
import {HsSyncErrorDialogComponent} from './sync-error-dialog.component';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {WINDOW_PROVIDERS} from '../utils/window';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
  declarations: [HsSaveMapComponent, HsSyncErrorDialogComponent],
  imports: [CommonModule, BrowserModule, NgbModule],
  exports: [HsSaveMapComponent],
  providers: [
    HsLayerSynchronizerService,
    HsLaymanService,
    HsSaveMapManagerService,
    HsSaveMapService,
    HsStatusManagerService,
    WINDOW_PROVIDERS,
  ],
  entryComponents: [HsSaveMapComponent],
})
export class HsSaveMapModule {}
