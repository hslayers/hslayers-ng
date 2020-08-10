import {BrowserModule} from '@angular/platform-browser';
import {CommonModule} from '@angular/common';
import {HsUiExtensionsRecursiveDd} from './recursive-dd.component';
import {NgModule} from '@angular/core';
/**
 * @namespace HsMiscModule
 * @memberOf hs
 */
@NgModule({
  declarations: [HsUiExtensionsRecursiveDd],
  imports: [CommonModule, BrowserModule],
  providers: [],
  entryComponents: [HsUiExtensionsRecursiveDd],
  exports: [HsUiExtensionsRecursiveDd],
})
export class HsUiExtensionsModule {}
