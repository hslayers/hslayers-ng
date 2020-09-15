import {HsMapService} from './map.service';

import {BrowserModule} from '@angular/platform-browser';
import {
  CUSTOM_ELEMENTS_SCHEMA,
  NO_ERRORS_SCHEMA,
  NgModule,
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {HsMapComponent} from './map.component';
import {HsMapHostDirective} from './map.directive'

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
  declarations: [HsMapComponent, HsMapHostDirective],
  imports: [CommonModule, BrowserModule],
  exports: [HsMapComponent],
  providers: [HsMapService],
  entryComponents: [HsMapComponent],
})
export class HsMapModule {}
