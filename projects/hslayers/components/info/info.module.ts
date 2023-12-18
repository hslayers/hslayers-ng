import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

import {HsInfoComponent} from './info.component';
import {TranslateCustomPipe} from '../language/translate-custom.pipe';
import {HsPanelHelpersModule} from '../layout/panels/panel-helpers.module';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [HsInfoComponent],
  imports: [FormsModule, CommonModule, HsPanelHelpersModule, TranslateCustomPipe],
  exports: [HsInfoComponent],
})
export class HsInfoModule {}
