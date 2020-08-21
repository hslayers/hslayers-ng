import {BrowserModule} from '@angular/platform-browser';
import {
  CUSTOM_ELEMENTS_SCHEMA,
  NO_ERRORS_SCHEMA,
  NgModule,
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {HsPanelHelpersModule} from '../layout/panels/panel-helpers.module';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
  declarations: [HsQueryComponent],
  imports: [CommonModule, BrowserModule, HsPanelHelpersModule, FormsModule],
  exports: [HsQueryComponent],
  providers: [],
  entryComponents: [HsQueryComponent],
})
export class HsQueryModule {}
