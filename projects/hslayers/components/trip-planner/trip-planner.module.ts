import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';

import {HsPanelHelpersModule} from 'hslayers-ng/common/panels';
import {HsTripPlannerComponent} from './trip-planner.component';
import {HsTripPlannerLayerSelectorComponent} from './layer-selector.component';
import {TranslateCustomPipe} from 'hslayers-ng/services/language';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [HsTripPlannerComponent, HsTripPlannerLayerSelectorComponent],
  imports: [
    FormsModule,
    CommonModule,
    TranslateCustomPipe,
    HsPanelHelpersModule,
    NgbDropdownModule,
  ],
  exports: [HsTripPlannerComponent, HsTripPlannerLayerSelectorComponent],
})
export class HsTripPlannerModule {}
