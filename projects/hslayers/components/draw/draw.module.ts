import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';

import {DrawEditComponent} from './draw-edit/draw-edit.component';
import {DrawPanelComponent} from './draw-panel/draw-panel.component';
import {HsDrawComponent} from './draw.component';
import {HsDrawLayerMetadataDialogComponent} from './draw-layer-metadata/draw-layer-metadata.component';
import {HsLaymanModule} from '../../common/layman/layman.module';
import {HsPanelHeaderComponent} from '../layout/panels/panel-header/panel-header.component';
import {HsPanelHelpersModule} from '../layout/panels/panel-helpers.module';
import {HsQueryModule} from '../query/query.module';
import {HsRmLayerDialogModule} from '../../common/remove-multiple/remove-layer-dialog.module';
import {HsStylerModule} from '../styler/styles.module';
import {TranslateCustomPipe} from '../language/translate-custom.pipe';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [
    HsDrawComponent,
    HsDrawLayerMetadataDialogComponent,
    DrawPanelComponent,
    DrawEditComponent,
  ],
  imports: [
    CommonModule,
    HsPanelHelpersModule,
    FormsModule,
    NgbDropdownModule,
    HsStylerModule,
    TranslateCustomPipe,
    HsQueryModule,
    HsLaymanModule,
    HsRmLayerDialogModule,
    HsPanelHeaderComponent,
  ],
  exports: [HsDrawComponent, HsDrawLayerMetadataDialogComponent],
})
export class HsDrawModule {}
