import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';

import {HsMapComponent} from './map.component';
import {HsMapDirective} from './map.directive';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [HsMapComponent, HsMapDirective],
  imports: [CommonModule],
  exports: [HsMapComponent],
})
export class HsMapModule {}
