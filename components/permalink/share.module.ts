import 'angular-cookies';
import {BrowserModule} from '@angular/platform-browser';
import {
  CUSTOM_ELEMENTS_SCHEMA,
  NO_ERRORS_SCHEMA,
  NgModule,
} from '@angular/core';
import {HsPanelHelpersModule} from '../layout/panel-helpers.module';
@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
  declarations: [],
  imports: [BrowserModule, HsPanelHelpersModule],
  exports: [],
  providers: [],
  entryComponents: [],
})
export class HsPermalinkModule {}
