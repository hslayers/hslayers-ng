/**
 * @namespace hs.print
 * @memberOf hs
 */

import { BrowserModule } from '@angular/platform-browser';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { HsPrintComponent } from './print.component';
import { HsPrintService } from './print.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from "@angular/common";
/**
 * @memberof hs.print
 * @ngdoc component
 * @name hs.print.component
 * @description Add print dialog template to the app
 */
@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [
    HsPrintComponent
  ],
  imports: [
    BrowserModule,
    CommonModule,
    FormsModule
  ],
  providers: [HsPrintService,
    {
      provide: Window, useValue: window
    }],
  entryComponents: [
    HsPrintComponent
  ],
})
export class HsPrintModule { }