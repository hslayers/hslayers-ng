/**
 * @namespace hs.print
 * @memberOf hs
 */
import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {HsCompositionsComponent} from './compositions.component';
import {HsCompositionsService} from './compositions.service';
import {HsPanelHelpersModule} from '../layout/panels/panel-helpers.module';
import {TranslateModule} from '@ngx-translate/core';
@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [HsCompositionsComponent],
  imports: [CommonModule, FormsModule, HsPanelHelpersModule, TranslateModule],
  exports: [HsCompositionsComponent],
  providers: [HsCompositionsService],
  entryComponents: [HsCompositionsComponent],
})
export class HsCompositionsModule {}
