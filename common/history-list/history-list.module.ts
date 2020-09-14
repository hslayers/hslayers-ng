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
import {TranslateModule, TranslateStore} from '@ngx-translate/core';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
  declarations: [HsHistoryListComponent],
  imports: [FormsModule, CommonModule, TranslateModule],
  exports: [HsHistoryListComponent],
  providers: [HsHistoryListService, CookieService, TranslateStore],
  entryComponents: [HsHistoryListComponent],
})
export class HsHistoryListModule {}
