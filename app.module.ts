/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import 'core-js/es6/reflect';
import 'core-js/es7/reflect';
import 'reflect-metadata';
import 'zone.js';
import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
//New rewritten modules:
//Old upgraded (not rewritten) services go here:
import {HsBootstrapComponent} from './bootstrap.component';
import {HsCoreModule} from './components/core';
import {HsLayoutModule} from './components/layout';

@NgModule({
  imports: [BrowserModule, HsCoreModule, HsLayoutModule],
  exports: [HsBootstrapComponent],
  declarations: [HsBootstrapComponent],
  entryComponents: [HsBootstrapComponent],
  providers: [],
  bootstrap: [HsBootstrapComponent],
})
export class HsAppModule {
  constructor() {}
}
