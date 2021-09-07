import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {HsLaymanModule} from '../../common/layman/layman.module';
import {HsPanelHelpersModule} from '../layout/panels/panel-helpers.module';
import {HsStylerModule} from '../styles/styles.module';
import {TranslateModule} from '@ngx-translate/core';

import {FormsModule} from '@angular/forms';
import {HsDrawComponent} from './draw.component';
import {HsDrawLayerMetadataDialogComponent} from './draw-layer-metadata.component';
import {HsDrawToolbarComponent} from './draw-toolbar.component';
import {HsQueryModule} from '../query/query.module';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
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
    HsQueryModule,
    HsLaymanModule,
  ],
  exports: [
    HsDrawComponent,
    HsDrawLayerMetadataDialogComponent,
    HsDrawToolbarComponent,
  ],
  entryComponents: [
    HsDrawComponent,
    HsDrawLayerMetadataDialogComponent,
    HsDrawToolbarComponent,
  ],
})
export class HsDrawModule {}
