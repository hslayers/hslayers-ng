import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';
import {TranslateModule} from '@ngx-translate/core';

import {HsClearLayerComponent} from './query-popup-layer/layer-widgets/clear-layer.component';
import {HsDownloadModule} from '../../common/download/download.module';
import {HsFeatureInfoComponent} from './query-popup-feature/feature-widgets/feature-info/feature-info.component';
import {HsPanelHelpersModule} from '../layout/panels/panel-helpers.module';
import {HsQueryAttributeRowComponent} from './attribute-row/attribute-row.component';
import {HsQueryComponent} from './query.component';
import {HsQueryDefaultInfoPanelBodyComponent} from './default-info-panel-body/default-info-panel-body.component';
import {HsQueryFeatureComponent} from './feature/feature.component';
import {HsQueryFeatureListComponent} from './feature-list/feature-list.component';
import {HsQueryPopupComponent} from './query-popup/query-popup.component';
import {HsQueryPopupFeatureComponent} from './query-popup-feature/query-popup-feature.component';
import {HsQueryPopupLayerComponent} from './query-popup-layer/query-popup-layer.component';
import {HsQueryPopupWidgetBaseComponent} from './query-popup-widget-base.component';

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
    HsQueryPopupLayerComponent,
    HsQueryPopupFeatureComponent,
    HsFeatureInfoComponent,
  ],
  imports: [
    CommonModule,
    HsPanelHelpersModule,
    FormsModule,
    TranslateModule,
    HsDownloadModule,
    NgbDropdownModule,
  ],
  exports: [
    HsQueryComponent,
    HsQueryPopupComponent,
    HsQueryFeatureComponent,
    HsQueryFeatureListComponent,
    HsClearLayerComponent,
    HsQueryPopupWidgetBaseComponent,
    HsQueryPopupLayerComponent,
    HsQueryPopupFeatureComponent,
    HsFeatureInfoComponent,
  ],
  entryComponents: [HsQueryComponent, HsQueryPopupComponent],
})
export class HsQueryModule {}
