import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {HsLanguageComponent} from './language.component';
import {HsPanelHelpersModule} from '../layout/panels/panel-helpers.module';
import {TranslateModule, TranslateStore} from '@ngx-translate/core';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [HsLanguageComponent],
  imports: [FormsModule, CommonModule, TranslateModule, HsPanelHelpersModule],
  exports: [HsLanguageComponent],
  providers: [TranslateStore],
})
export class HsLanguageModule {}
