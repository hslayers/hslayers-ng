import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';
import {TranslatePipe} from '@ngx-translate/core';

import {HsFeatureFilterPipe} from './feature-filter.pipe';
import {HsFeatureTableComponent} from './feature-table.component';
import {HsLayerFeaturesComponent} from './layer-features.component';
import {
  HsPanelHeaderComponent,
  HsPanelHelpersModule,
} from 'hslayers-ng/common/panels';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [
    HsFeatureTableComponent,
    HsLayerFeaturesComponent,
    HsFeatureFilterPipe,
  ],
  imports: [
    CommonModule,
    FormsModule,
    HsPanelHelpersModule,
    TranslatePipe,
    NgbDropdownModule,
    HsPanelHeaderComponent,
  ],
  exports: [
    HsFeatureTableComponent,
    HsLayerFeaturesComponent,
    HsFeatureFilterPipe,
  ],
})
export class HsFeatureTableModule {}
