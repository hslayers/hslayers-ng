import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {NgbToastModule} from '@ng-bootstrap/ng-bootstrap';

import {HsToastComponent} from './toast.component';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [HsToastComponent],
  imports: [CommonModule, NgbToastModule],
  exports: [HsToastComponent],
})
export class HsToastModule {}
