import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

import {HsClearLayerComponent} from './widgets/clear-layer.component';
import {HsDownloadModule} from 'hslayers-ng/common/download';
import {HsDynamicTextComponent} from './widgets/dynamic-text.component';
import {HsFeatureInfoComponent} from './widgets/feature-info.component';
import {HsLayerNameComponent} from './widgets/layer-name.component';
import {HsPanelHeaderComponent} from 'hslayers-ng/common/panels';
import {HsPanelHelpersModule} from 'hslayers-ng/common/panels';
import {HsQueryPopupComponent} from './query-popup.component';
import {HsQueryPopupWidgetBaseComponent} from './query-popup-widget-base.component';
import {TranslateCustomPipe} from 'hslayers-ng/shared/language';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [
    HsQueryPopupComponent,
    HsClearLayerComponent,
    HsQueryPopupWidgetBaseComponent,
    HsFeatureInfoComponent,
    HsLayerNameComponent,
    HsDynamicTextComponent,
  ],
  imports: [
    CommonModule,
    HsPanelHelpersModule,
    FormsModule,
    TranslateCustomPipe,
    HsDownloadModule,
    HsPanelHeaderComponent,
  ],
  exports: [
    HsQueryPopupComponent,
    HsClearLayerComponent,
    HsQueryPopupWidgetBaseComponent,
    HsFeatureInfoComponent,
    HsLayerNameComponent,
    HsDynamicTextComponent,
  ],
})
export class HsQueryPopupModule {}
