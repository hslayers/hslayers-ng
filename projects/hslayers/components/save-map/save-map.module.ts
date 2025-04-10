import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

import {HsLaymanCurrentUserComponent} from 'hslayers-ng/common/layman';
import {
  HsPanelHeaderComponent,
  HsPanelHelpersModule,
} from 'hslayers-ng/common/panels';
import {HsSaveMapComponent} from './save-map.component';
import {TranslateCustomPipe} from 'hslayers-ng/services/language';
import {HsSaveMapFormComponent} from './form/form.component';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [HsSaveMapComponent],
  imports: [
    CommonModule,
    HsPanelHelpersModule,
    TranslateCustomPipe,
    HsLaymanCurrentUserComponent,
    HsPanelHeaderComponent,
    HsSaveMapFormComponent,
  ],
  exports: [HsSaveMapComponent],
})
export class HsSaveMapModule {}
