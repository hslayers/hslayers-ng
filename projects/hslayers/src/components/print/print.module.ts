/**
 * @namespace hs.print
 * @memberOf hs
 */
import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {HsPanelHelpersModule} from '../layout/panels/panel-helpers.module';
import {HsPrintComponent} from './print.component';
import {HsPrintService} from './print.service';
import {TranslateModule} from '@ngx-translate/core';
/**
 * @memberof hs.print
 * @ngdoc component
 * @name hs.print.component
 * @description Add print dialog template to the app
 */
@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [HsPrintComponent],
  imports: [CommonModule, FormsModule, HsPanelHelpersModule, TranslateModule],
  exports: [HsPrintComponent],
  providers: [HsPrintService],
})
export class HsPrintModule {}
