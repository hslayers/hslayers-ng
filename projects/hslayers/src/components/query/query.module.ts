import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';
import {TranslateModule} from '@ngx-translate/core';

import {HsClearLayerComponent} from './feature-popup-layer/layer-widgets/clear-layer.component';
import {HsDownloadModule} from '../../common/download/download.module';
import {HsFeaturePopupLayerComponent} from './feature-popup-layer/feature-popup-layer.component';
import {HsFeaturePopupWidgetBaseComponent} from './feature-popup-widget-base.component';
import {HsPanelHelpersModule} from '../layout/panels/panel-helpers.module';
import {HsQueryAttributeRowComponent} from './attribute-row/attribute-row.component';
import {HsQueryComponent} from './query.component';
import {HsQueryDefaultInfoPanelBodyComponent} from './default-info-panel-body/default-info-panel-body.component';
import {HsQueryFeatureComponent} from './feature/feature.component';
import {HsQueryFeatureListComponent} from './feature-list/feature-list.component';
import {HsQueryFeaturePopupComponent} from './feature-popup/feature-popup.component';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [
    HsQueryComponent,
    HsQueryFeaturePopupComponent,
    HsQueryFeatureComponent,
    HsQueryFeatureListComponent,
    HsQueryDefaultInfoPanelBodyComponent,
    HsQueryAttributeRowComponent,
    HsClearLayerComponent,
    HsFeaturePopupWidgetBaseComponent,
    HsFeaturePopupLayerComponent,
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
    HsQueryFeaturePopupComponent,
    HsQueryFeatureComponent,
    HsQueryFeatureListComponent,
    HsClearLayerComponent,
    HsFeaturePopupWidgetBaseComponent,
    HsFeaturePopupLayerComponent,
  ],
  entryComponents: [HsQueryComponent, HsQueryFeaturePopupComponent],
})
export class HsQueryModule {}
