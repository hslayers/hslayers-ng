import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';

import {DrawEditComponent} from './draw-edit/draw-edit.component';
import {DrawPanelComponent} from './draw-panel/draw-panel.component';
import {HsDrawComponent} from './draw.component';
import {HsDrawLayerMetadataDialogComponent} from './draw-layer-metadata/draw-layer-metadata.component';
import {HsLaymanModule} from 'hslayers-ng/common/layman';
import {HsPanelHeaderComponent} from 'hslayers-ng/components/layout';
import {HsPanelHelpersModule} from 'hslayers-ng/components/layout';
import {HsQueryModule} from 'hslayers-ng/components/query';
import {HsRmLayerDialogModule} from 'hslayers-ng/common/remove-multiple';
import {HsStylerModule} from 'hslayers-ng/components/styler';
import {TranslateCustomPipe} from 'hslayers-ng/components/language';

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
