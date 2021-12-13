import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {HsLaymanModule} from '../../common/layman/layman.module';
import {HsPanelHelpersModule} from '../layout/panels/panel-helpers.module';
import {HsStylerModule} from '../styles/styles.module';
import {TranslateModule} from '@ngx-translate/core';

import {DrawEditComponent} from './draw-edit/draw-edit.component';
import {DrawPanelComponent} from './draw-panel/draw-panel.component';
import {FormsModule} from '@angular/forms';
import {HsDrawComponent} from './draw.component';
import {HsDrawLayerMetadataDialogComponent} from './draw-layer-metadata/draw-layer-metadata.component';
import {HsDrawToolbarComponent} from './draw-toolbar/draw-toolbar.component';
import {HsQueryModule} from '../query/query.module';
import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [
    HsDrawComponent,
    HsDrawLayerMetadataDialogComponent,
    HsDrawToolbarComponent,
    DrawPanelComponent,
    DrawEditComponent,
  ],
  imports: [
    CommonModule,
    HsPanelHelpersModule,
    FormsModule,
    NgbDropdownModule,
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
})
export class HsDrawModule {}
