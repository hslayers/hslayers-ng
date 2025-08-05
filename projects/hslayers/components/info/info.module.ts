import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {TranslatePipe} from '@ngx-translate/core';

import {HsInfoComponent} from './info.component';
import {HsPanelHelpersModule} from 'hslayers-ng/common/panels';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [HsInfoComponent],
  imports: [FormsModule, CommonModule, HsPanelHelpersModule, TranslatePipe],
  exports: [HsInfoComponent],
})
export class HsInfoModule {}
