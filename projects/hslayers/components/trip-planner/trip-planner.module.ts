import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';
import {TranslatePipe} from '@ngx-translate/core';

import {
  HsPanelHeaderComponent,
  HsPanelHelpersModule,
} from 'hslayers-ng/common/panels';
import {HsTripPlannerComponent} from './trip-planner.component';
import {HsTripPlannerLayerSelectorComponent} from './layer-selector.component';
import {HsTripPlannerProfileSelectorComponent} from './route-profile-selector.component';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [
    HsTripPlannerComponent,
    HsTripPlannerLayerSelectorComponent,
    HsTripPlannerProfileSelectorComponent,
  ],
  imports: [
    FormsModule,
    CommonModule,
    TranslatePipe,
    HsPanelHelpersModule,
    HsPanelHeaderComponent,
    NgbDropdownModule,
  ],
  exports: [
    HsTripPlannerComponent,
    HsTripPlannerLayerSelectorComponent,
    HsTripPlannerProfileSelectorComponent,
  ],
})
export class HsTripPlannerModule {}
