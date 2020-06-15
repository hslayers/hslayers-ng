  /**
 * @namespace hs.legend
 * @memberOf hs
 */
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from "@angular/common";
import { BrowserModule } from '@angular/platform-browser';
import { HsCoreService } from './core.service';
import { HsLogService } from './log.service';
@NgModule({
  declarations: [
  ],
  imports: [
    CommonModule,
    BrowserModule
  ],
  exports: [
  ],
  providers: [HsCoreService,
    {
      provide: Window, useValue: window
    },
    HsLogService],
  entryComponents: [
  ]
})
export class HsCoreModule {
}


