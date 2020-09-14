import {BrowserModule} from '@angular/platform-browser';
import {
  CUSTOM_ELEMENTS_SCHEMA,
  NO_ERRORS_SCHEMA,
  NgModule,
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {CookieService} from 'ngx-cookie-service';
import {FormsModule} from '@angular/forms';
import {HsHistoryListComponent} from './history-list.component';
import {HsHistoryListService} from './history-list.service';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
  declarations: [HsHistoryListComponent],
  imports: [BrowserModule, FormsModule, CommonModule],
  exports: [HsHistoryListComponent],
  providers: [HsHistoryListService, CookieService],
  entryComponents: [HsHistoryListComponent],
})
export class HsHistoryListModule {}
