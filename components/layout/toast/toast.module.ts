import {
  CUSTOM_ELEMENTS_SCHEMA,
  NO_ERRORS_SCHEMA,
  NgModule,
} from '@angular/core';
import {CommonModule} from '@angular/common';

import {NgbModule} from '@ng-bootstrap/ng-bootstrap';

import {HsToastComponent} from './toast.component';
import {HsToastService} from './toast.service';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
  declarations: [HsToastComponent],
  imports: [CommonModule, NgbModule],
  exports: [HsToastComponent],
  providers: [HsToastService],
})
export class HsToastModule {}
