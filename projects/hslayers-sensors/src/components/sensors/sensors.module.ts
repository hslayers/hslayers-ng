import {
  CUSTOM_ELEMENTS_SCHEMA,
  NO_ERRORS_SCHEMA,
  NgModule,
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

import {
  HsLogModule,
  HsPanelHeaderComponent,
  TranslateCustomPipe,
} from 'hslayers-ng';
import {NgbDatepickerModule} from '@ng-bootstrap/ng-bootstrap';

import {HsSensorsComponent} from './sensors.component';
import {HsSensorsService} from './sensors.service';
import {HsSensorsUnitDialogComponent} from './sensors-unit-dialog.component';
import {HsSensorsUnitDialogService} from './unit-dialog.service';
import {HsSensorsUnitListItemComponent} from './sensors-unit-list-item.component';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
  declarations: [
    HsSensorsComponent,
    HsSensorsUnitDialogComponent,
    HsSensorsUnitListItemComponent,
  ],
  imports: [
    CommonModule,
    HsLogModule,
    FormsModule,
    NgbDatepickerModule,
    TranslateCustomPipe,
    HsPanelHeaderComponent,
  ],
  exports: [
    HsSensorsComponent,
    HsSensorsUnitDialogComponent,
    HsSensorsUnitListItemComponent,
  ],
  providers: [HsSensorsService, HsSensorsUnitDialogService],
})
export class HsSensorsModule {}
