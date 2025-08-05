import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {TranslatePipe} from '@ngx-translate/core';

import {HsGeolocationComponent} from './geolocation.component';
import {HsPanelHelpersModule} from 'hslayers-ng/common/panels';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [HsGeolocationComponent],
  imports: [FormsModule, CommonModule, HsPanelHelpersModule, TranslatePipe],
  exports: [HsGeolocationComponent],
})
export class HsGeolocationModule {}
