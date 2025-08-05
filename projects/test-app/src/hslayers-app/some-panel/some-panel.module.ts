import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {TranslatePipe} from '@ngx-translate/core';

import {
  HsPanelHelpersModule,
  HsPanelHeaderComponent,
} from 'hslayers-ng/common/panels';
import {SomeComponent} from './some-panel.component';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe,
    HsPanelHelpersModule,
    HsPanelHeaderComponent,
  ],
  exports: [],
  declarations: [SomeComponent],
  providers: [],
})
export class SomeModule {}
