import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

import {HsInfoComponent} from './info.component';
import {HsPanelHelpersModule} from 'hslayers-ng/common/panels';
import {TranslateCustomPipe} from 'hslayers-ng/services/language';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [HsInfoComponent],
  imports: [
    FormsModule,
    CommonModule,
    HsPanelHelpersModule,
    TranslateCustomPipe,
  ],
  exports: [HsInfoComponent],
})
export class HsInfoModule {}
