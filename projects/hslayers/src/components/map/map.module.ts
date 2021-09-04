import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {HsMapComponent} from './map.component';
import {HsMapHostDirective} from './map.directive';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [HsMapComponent, HsMapHostDirective],
  imports: [CommonModule],
  exports: [HsMapComponent],
  entryComponents: [HsMapComponent],
})
export class HsMapModule {}
