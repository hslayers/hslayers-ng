import '../core/';
import '../utils';
import {
  CUSTOM_ELEMENTS_SCHEMA,
  NO_ERRORS_SCHEMA,
  NgModule,
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {HsPanelHelpersModule} from '../layout/panels/panel-helpers.module';
import {HsStylerModule} from '../styles/styles.module';
import {TranslateModule, TranslateStore} from '@ngx-translate/core';

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
    HsPanelHelpersModule,
    FormsModule,
    NgbModule,
    HsStylerModule,
    TranslateModule,
  ],
  exports: [
    HsDrawComponent,
    HsDrawLayerMetadataDialogComponent,
    HsDrawToolbarComponent,
  ],
  providers: [HsDrawService, TranslateStore],
  entryComponents: [
    HsDrawComponent,
    HsDrawLayerMetadataDialogComponent,
    HsDrawToolbarComponent,
  ],
})
export class HsDrawModule {}
