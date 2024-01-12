import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';

import {HsDownloadModule} from 'hslayers-ng/common/download';
import {HsPanelHeaderComponent} from 'hslayers-ng/common/panels';
import {HsPanelHelpersModule} from 'hslayers-ng/common/panels';
import {HsQueryAttributeRowComponent} from './attribute-row/attribute-row.component';
import {HsQueryComponent} from './query.component';
import {HsQueryDefaultInfoPanelBodyComponent} from './default-info-panel-body/default-info-panel-body.component';
import {HsQueryFeatureComponent} from './feature/feature.component';
import {HsQueryFeatureListComponent} from './feature-list/feature-list.component';
import {TranslateCustomPipe} from 'hslayers-ng/shared/language';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [
    HsQueryComponent,
    HsQueryFeatureComponent,
    HsQueryFeatureListComponent,
    HsQueryDefaultInfoPanelBodyComponent,
    HsQueryAttributeRowComponent,
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
    HsQueryFeatureComponent,
    HsQueryFeatureListComponent,
  ],
})
export class HsQueryModule {}
