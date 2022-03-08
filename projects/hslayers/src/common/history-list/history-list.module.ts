import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {CookieService} from 'ngx-cookie-service';
import {FormsModule} from '@angular/forms';
import {HsHistoryListComponent} from './history-list.component';
import {HsLanguageModule} from '../../components/language/language.module';
import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [HsHistoryListComponent],
  imports: [FormsModule, CommonModule, HsLanguageModule, NgbDropdownModule],
  exports: [HsHistoryListComponent],
  providers: [CookieService],
})
export class HsHistoryListModule {}
