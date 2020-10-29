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
import {HsTripPlannerToolbarButtonComponent} from './trip-planner-toolbar-button.component';
import {TranslateModule, TranslateStore} from '@ngx-translate/core';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
  declarations: [HsTripPlannerComponent, HsTripPlannerToolbarButtonComponent],
  imports: [FormsModule, CommonModule, TranslateModule, HsPanelHelpersModule],
  exports: [HsTripPlannerComponent, HsTripPlannerToolbarButtonComponent],
  providers: [TranslateStore, HsTripPlannerService],
  entryComponents: [HsTripPlannerComponent],
})
export class HsTripPlannerModule {}
