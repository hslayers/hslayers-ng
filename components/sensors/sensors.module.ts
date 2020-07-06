/**
 * @namespace hs.legend
 * @memberOf hs
 */
import {BrowserModule} from '@angular/platform-browser';
import {CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA} from '@angular/core';
import {CommonModule} from '@angular/common';
import {HsPanelHelpersModule} from '../layout/panel-helpers.module';
import {HsSensorsComponent} from './sensors.component';
import {HsSensorsService} from './sensors.service';
import {HsSensorsUnitDialogComponent} from './sensors-unit-dialog.component';
import {HsSensorsUnitListItemComponent} from './sensors-unit-list-item.component';
import { HsSensorsUnitDialogService } from './unit-dialog.service';
import { FormsModule } from '@angular/forms';
@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
  declarations: [
    HsSensorsComponent,
    HsSensorsUnitDialogComponent,
    HsSensorsUnitListItemComponent,
  ],
  imports: [CommonModule, BrowserModule, HsPanelHelpersModule, FormsModule],
  exports: [
    HsSensorsComponent,
    HsSensorsUnitDialogComponent,
    HsSensorsUnitListItemComponent,
  ],
  providers: [HsSensorsService, HsSensorsUnitDialogService],
  entryComponents: [HsSensorsComponent, HsSensorsUnitDialogComponent],
})
export class HsSensorsModule {}
