import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {CookieService} from 'ngx-cookie-service';
import {FormsModule} from '@angular/forms';
import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';
import {TranslatePipe} from '@ngx-translate/core';

import {HsHistoryListComponent} from './history-list.component';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [HsHistoryListComponent],
  imports: [FormsModule, CommonModule, TranslatePipe, NgbDropdownModule],
  exports: [HsHistoryListComponent],
  providers: [CookieService],
})
export class HsHistoryListModule {}
