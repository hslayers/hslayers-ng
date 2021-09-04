import {
  CUSTOM_ELEMENTS_SCHEMA,
  NO_ERRORS_SCHEMA,
  NgModule,
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

import {HsDownloadModule} from '../../common/download/download.module';
import {HsPanelHelpersModule} from '../layout/panels/panel-helpers.module';
import {HsQueryAttributeRowComponent} from './attribute-row.component';
import {HsQueryComponent} from './query.component';
import {HsQueryDefaultInfoPanelBodyComponent} from './default-info-panel-body.component';
import {HsQueryFeatureComponent} from './feature.component';
import {HsQueryFeatureListComponent} from './feature-list.component';
import {HsQueryFeaturePopupComponent} from './feature-popup.component';
import {TranslateModule} from '@ngx-translate/core';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
  declarations: [
    HsQueryComponent,
    HsQueryFeaturePopupComponent,
    HsQueryFeatureComponent,
    HsQueryFeatureListComponent,
    HsQueryDefaultInfoPanelBodyComponent,
    HsQueryAttributeRowComponent,
  ],
  imports: [
    CommonModule,
    HsPanelHelpersModule,
    FormsModule,
    TranslateModule,
    HsDownloadModule,
  ],
  exports: [
    HsQueryComponent,
    HsQueryFeaturePopupComponent,
    HsQueryFeatureComponent,
    HsQueryFeatureListComponent,
  ],
  entryComponents: [HsQueryComponent, HsQueryFeaturePopupComponent],
})
export class HsQueryModule {}
