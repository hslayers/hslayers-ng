import '../core/';
import '../map/map.module';
import '../utils/utils.module';
import * as angular from 'angular';
import {BrowserModule} from '@angular/platform-browser';
import {
  CUSTOM_ELEMENTS_SCHEMA,
  NO_ERRORS_SCHEMA,
  NgModule,
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {HsPanelHelpersModule} from '../layout/panel-helpers.module';

import {FormsModule} from '@angular/forms';
import {HsDrawComponent} from './draw.component';
import {HsDrawLayerMetadataDialogComponent} from './draw-layer-metadata.component';
import {HsDrawService} from './draw.service';
import {HsDrawToolbarComponent} from './draw-toolbar.component';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
  declarations: [
    HsDrawComponent,
    HsDrawLayerMetadataDialogComponent,
    HsDrawToolbarComponent,
  ],
  imports: [
    CommonModule,
    BrowserModule,
    HsPanelHelpersModule,
    FormsModule,
    NgbModule,
  ],
  exports: [
    HsDrawComponent,
    HsDrawLayerMetadataDialogComponent,
    HsDrawToolbarComponent,
  ],
  providers: [HsDrawService],
  entryComponents: [
    HsDrawComponent,
    HsDrawLayerMetadataDialogComponent,
    HsDrawToolbarComponent,
  ],
})
export class HsDrawModule {}