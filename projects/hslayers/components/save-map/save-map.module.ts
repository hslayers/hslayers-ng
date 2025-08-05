import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {TranslatePipe} from '@ngx-translate/core';

import {HsLaymanCurrentUserComponent} from 'hslayers-ng/common/layman';
import {
  HsPanelHeaderComponent,
  HsPanelHelpersModule,
} from 'hslayers-ng/common/panels';
import {HsSaveMapComponent} from './save-map.component';
import {HsSaveMapFormComponent} from './form/form.component';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [HsSaveMapComponent],
  imports: [
    CommonModule,
    HsPanelHelpersModule,
    TranslatePipe,
    HsLaymanCurrentUserComponent,
    HsPanelHeaderComponent,
    HsSaveMapFormComponent,
  ],
  exports: [HsSaveMapComponent],
})
export class HsSaveMapModule {}
