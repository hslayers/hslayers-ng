import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';

import {HsClearLayerComponent} from './widgets/clear-layer.component';
import {HsDownloadModule} from 'hslayers-ng/common/download';
import {HsDynamicTextComponent} from './widgets/dynamic-text.component';
import {HsFeatureInfoComponent} from './widgets/feature-info.component';
import {HsLayerNameComponent} from './widgets/layer-name.component';
import {HsPanelHeaderComponent} from 'hslayers-ng/components/layout';
import {HsPanelHelpersModule} from 'hslayers-ng/components/layout';
import {HsQueryAttributeRowComponent} from './attribute-row/attribute-row.component';
import {HsQueryComponent} from './query.component';
import {HsQueryDefaultInfoPanelBodyComponent} from './default-info-panel-body/default-info-panel-body.component';
import {HsQueryFeatureComponent} from './feature/feature.component';
import {HsQueryFeatureListComponent} from './feature-list/feature-list.component';
import {HsQueryPopupComponent} from './query-popup/query-popup.component';
import {HsQueryPopupWidgetBaseComponent} from './query-popup-widget-base.component';
import {TranslateCustomPipe} from 'hslayers-ng/components/language';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [
    HsQueryComponent,
    HsQueryPopupComponent,
    HsQueryFeatureComponent,
    HsQueryFeatureListComponent,
    HsQueryDefaultInfoPanelBodyComponent,
    HsQueryAttributeRowComponent,
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
    NgbDropdownModule,
    HsPanelHeaderComponent,
  ],
  exports: [
    HsQueryComponent,
    HsQueryPopupComponent,
    HsQueryFeatureComponent,
    HsQueryFeatureListComponent,
    HsClearLayerComponent,
    HsQueryPopupWidgetBaseComponent,
    HsFeatureInfoComponent,
    HsLayerNameComponent,
    HsDynamicTextComponent,
  ],
})
export class HsQueryModule {}
