/**
* @namespace hs.legend
* @memberOf hs
*/
import { NgModule } from '@angular/core';
import { CommonModule } from "@angular/common";
import { BrowserModule } from '@angular/platform-browser';
import { HsCoreService } from './core.service';
import { HsLogService } from './log.service';
import { HsLayoutModule } from '../layout/layout.module';
import { HsMapServiceProvider, HsUtilsServiceProvider, HsConfigProvider } from '../../ajs-upgraded-providers';
import { HsLegendModule } from '../legend';
import { HsPrintModule } from '../print';
@NgModule({
  declarations: [
  ],
  imports: [
    CommonModule,
    BrowserModule,
    HsLayoutModule,
    HsLegendModule,
    HsPrintModule
  ],
  exports: [
  ],
  providers: [
    HsCoreService,
    HsMapServiceProvider,
    HsConfigProvider,
    HsUtilsServiceProvider,
    {
      provide: Window, useValue: window
    },
    HsLogService],
  entryComponents: [
  ]
})
export class HsCoreModule {
}


