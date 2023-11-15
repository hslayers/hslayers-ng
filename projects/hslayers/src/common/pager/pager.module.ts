import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {NgModule} from '@angular/core';

import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';

import {TranslateCustomPipe} from '../../components/language/translate-custom.pipe';
import {HsPagerComponent} from './pager.component';

@NgModule({
  declarations: [HsPagerComponent],
  imports: [CommonModule, TranslateCustomPipe, FormsModule, NgbDropdownModule],
  exports: [HsPagerComponent],
})
export class HsPagerModule {}
