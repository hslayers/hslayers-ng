import {
  CUSTOM_ELEMENTS_SCHEMA,
  NO_ERRORS_SCHEMA,
  NgModule,
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {HsPanelHelpersModule} from '../layout/panels/panel-helpers.module';
import {HsQueryAttributeRowComponent} from './attribute-row.component';
import {HsQueryBaseService} from './query-base.service';
import {HsQueryComponent} from './query.component';
import {HsQueryDefaultInfoPanelBodyComponent} from './default-info-panel-body.component';
import {HsQueryFeatureComponent} from './feature.component';
import {HsQueryFeaturePopupComponent} from './feature-popup.component';
import {HsQueryVectorService} from './query-vector.service';
import {HsQueryWmsService} from './query-wms.service';
import {HsQueryWmtsService} from './query-wmts.service';
import {TranslateModule} from '@ngx-translate/core';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
  declarations: [
    HsQueryComponent,
    HsQueryFeaturePopupComponent,
    HsQueryFeatureComponent,
    HsQueryDefaultInfoPanelBodyComponent,
    HsQueryAttributeRowComponent,
  ],
  imports: [CommonModule, HsPanelHelpersModule, FormsModule, TranslateModule],
  exports: [
    HsQueryComponent,
    HsQueryFeaturePopupComponent,
    HsQueryFeatureComponent,
  ],
  providers: [
    HsQueryBaseService,
    HsQueryVectorService,
    HsQueryWmsService,
    HsQueryWmtsService,
  ],
  entryComponents: [HsQueryComponent, HsQueryFeaturePopupComponent],
})
export class HsQueryModule {}
