import {
  CUSTOM_ELEMENTS_SCHEMA,
  NO_ERRORS_SCHEMA,
  NgModule,
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {HsPanelHelpersModule} from '../layout/panels/panel-helpers.module';
import {HsTripPlannerComponent} from './trip-planner.component';
import {HsTripPlannerService} from './trip-planner.service';
import {TranslateModule} from '@ngx-translate/core';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
  declarations: [HsTripPlannerComponent],
  imports: [FormsModule, CommonModule, TranslateModule, HsPanelHelpersModule],
  exports: [HsTripPlannerComponent],
  providers: [HsTripPlannerService],
})
export class HsTripPlannerModule {}
