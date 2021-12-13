import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {HsGeolocationComponent} from './geolocation.component';
import {HsPanelHelpersModule} from '../layout/panels/panel-helpers.module';
import {TranslateModule} from '@ngx-translate/core';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [HsGeolocationComponent],
  imports: [FormsModule, CommonModule, HsPanelHelpersModule, TranslateModule],
  exports: [HsGeolocationComponent],
})
export class HsGeolocationModule {}
