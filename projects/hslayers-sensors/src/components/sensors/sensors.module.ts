import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {NO_ERRORS_SCHEMA, NgModule} from '@angular/core';
import {NgbDatepickerModule} from '@ng-bootstrap/ng-bootstrap';

import {HsPanelHeaderComponent} from 'hslayers-ng/common/panels';
import {TranslateCustomPipe} from 'hslayers-ng/services/language';

import {HsSensorsComponent} from './sensors.component';
import {HsSensorsUnitDialogComponent} from './sensors-unit-dialog.component';
import {HsSensorsUnitListItemComponent} from './sensors-unit-list-item.component';

@NgModule({
  schemas: [NO_ERRORS_SCHEMA],
  declarations: [
    HsSensorsComponent,
    HsSensorsUnitDialogComponent,
    HsSensorsUnitListItemComponent,
  ],
  imports: [
    CommonModule,
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
})
export class HsSensorsModule {}
