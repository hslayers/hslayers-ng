import {
  CUSTOM_ELEMENTS_SCHEMA,
  NO_ERRORS_SCHEMA,
  NgModule,
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {HsMapComponent} from './map.component';
import {HsMapHostDirective} from './map.directive';
import {HsMapService} from './map.service';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
  declarations: [HsMapComponent, HsMapHostDirective],
  imports: [CommonModule],
  exports: [HsMapComponent],
  providers: [HsMapService],
})
export class HsMapModule {}
