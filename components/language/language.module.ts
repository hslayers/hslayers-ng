import {
  CUSTOM_ELEMENTS_SCHEMA,
  NO_ERRORS_SCHEMA,
  NgModule,
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {HsLanguageComponent} from './language.component';
import {HsLanguageService} from './language.service';
import {TranslateModule} from '@ngx-translate/core';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
  declarations: [HsLanguageComponent],
  imports: [FormsModule, CommonModule, TranslateModule],
  exports: [HsLanguageComponent],
  providers: [HsLanguageService],
  entryComponents: [HsLanguageComponent],
})
export class HsLanguageModule {}
