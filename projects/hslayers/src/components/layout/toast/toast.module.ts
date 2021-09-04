import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {HsToastComponent} from './toast.component';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [HsToastComponent],
  imports: [CommonModule, NgbModule],
  exports: [HsToastComponent],
})
export class HsToastModule {}
