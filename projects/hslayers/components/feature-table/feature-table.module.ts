import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {HsFeatureFilterPipe} from './feature-filter.pipe';
import {HsFeatureTableComponent} from './feature-table.component';
import {HsLayerFeaturesComponent} from './layer-features.component';
import {HsPanelHeaderComponent} from 'hslayers-ng/common/panels';
import {HsPanelHelpersModule} from 'hslayers-ng/common/panels';
import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';
import {TranslateCustomPipe} from 'hslayers-ng/shared/language';

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
    TranslateCustomPipe,
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
