import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';

import {HsPanelHelpersModule} from '../layout/panels/panel-helpers.module';
import {HsTripPlannerComponent} from './trip-planner.component';
import {HsTripPlannerLayerSelectorComponent} from './layer-selector.component';
import {TranslateCustomPipe} from '../language/translate-custom.pipe';

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
