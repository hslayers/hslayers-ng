import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

import {HsGeolocationComponent} from './geolocation.component';
import {TranslateCustomPipe} from 'hslayers-ng/shared/language';
import {HsPanelHelpersModule} from 'hslayers-ng/common/panels';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [HsGeolocationComponent],
  imports: [FormsModule, CommonModule, HsPanelHelpersModule, TranslateCustomPipe],
  exports: [HsGeolocationComponent],
})
export class HsGeolocationModule {}
