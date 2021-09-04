import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {HsDragDirective} from './drag.directive';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [HsDragDirective],
  imports: [FormsModule, CommonModule],
  exports: [HsDragDirective],
})
export class HsDragModule {}
