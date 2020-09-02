import 'angular-cookies';
import {BrowserModule} from '@angular/platform-browser';
import {
  CUSTOM_ELEMENTS_SCHEMA,
  NO_ERRORS_SCHEMA,
  NgModule,
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {HsGeolocationComponent} from './geolocation.component';
import {HsGeolocationService} from './geolocation.service';
import {HsLayoutModule} from './../layout/layout.module';
import {HsPanelHelpersModule} from '../layout/panels/panel-helpers.module';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
  declarations: [HsGeolocationComponent],
  imports: [
    BrowserModule,
    FormsModule,
    CommonModule,
    HsPanelHelpersModule,
    HsLayoutModule,
  ],
  exports: [HsGeolocationComponent],
  providers: [HsGeolocationService],
  entryComponents: [HsGeolocationComponent],
})
export class HsGeolocationModule {}
