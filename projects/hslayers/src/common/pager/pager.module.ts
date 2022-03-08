import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {NgModule} from '@angular/core';

import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';

import {HsLanguageModule} from '../../components/language/language.module';
import {HsPagerComponent} from './pager.component';

@NgModule({
  declarations: [HsPagerComponent],
  imports: [CommonModule, HsLanguageModule, FormsModule, NgbDropdownModule],
  exports: [HsPagerComponent],
})
export class HsPagerModule {}
