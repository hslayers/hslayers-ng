import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {NgModule} from '@angular/core';

import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';

import {HsPagerComponent} from './pager.component';
import {TranslateCustomPipe} from 'hslayers-ng/services/language';

@NgModule({
  declarations: [HsPagerComponent],
  imports: [CommonModule, TranslateCustomPipe, FormsModule, NgbDropdownModule],
  exports: [HsPagerComponent],
})
export class HsPagerModule {}
