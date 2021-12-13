import {
  CUSTOM_ELEMENTS_SCHEMA,
  NO_ERRORS_SCHEMA,
  NgModule,
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {HsLogModule} from 'hslayers-ng';
import {HsPanelHelpersModule} from 'hslayers-ng';
import {HsSensorsComponent} from './sensors.component';
import {HsSensorsService} from './sensors.service';
import {HsSensorsUnitDialogComponent} from './sensors-unit-dialog.component';
import {HsSensorsUnitDialogService} from './unit-dialog.service';
import {HsSensorsUnitListItemComponent} from './sensors-unit-list-item.component';
import {NgbDatepickerModule} from '@ng-bootstrap/ng-bootstrap';
import {TranslateModule} from '@ngx-translate/core';
@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
  declarations: [
    HsSensorsComponent,
    HsSensorsUnitDialogComponent,
    HsSensorsUnitListItemComponent,
  ],
  imports: [
    CommonModule,
    HsPanelHelpersModule,
    HsLogModule,
    FormsModule,
    NgbDatepickerModule,
    TranslateModule,
  ],
  exports: [
    HsSensorsComponent,
    HsSensorsUnitDialogComponent,
    HsSensorsUnitListItemComponent,
  ],
  providers: [HsSensorsService, HsSensorsUnitDialogService],
})
export class HsSensorsModule {}
