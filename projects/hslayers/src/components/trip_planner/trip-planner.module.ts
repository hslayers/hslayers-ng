import {
  CUSTOM_ELEMENTS_SCHEMA,
  NO_ERRORS_SCHEMA,
  NgModule,
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {TranslateModule} from '@ngx-translate/core';

import {HsPanelHelpersModule} from '../layout/panels/panel-helpers.module';
import {HsTripPlannerComponent} from './trip-planner.component';
import {HsTripPlannerLayerSelectorComponent} from './layer-selector.component';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
  declarations: [HsTripPlannerComponent, HsTripPlannerLayerSelectorComponent],
  imports: [FormsModule, CommonModule, TranslateModule, HsPanelHelpersModule],
  exports: [HsTripPlannerComponent, HsTripPlannerLayerSelectorComponent],
  entryComponents: [
    HsTripPlannerComponent,
    HsTripPlannerLayerSelectorComponent,
  ],
})
export class HsTripPlannerModule {}
