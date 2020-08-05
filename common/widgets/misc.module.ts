import {BrowserModule} from '@angular/platform-browser';
import {CommonModule} from '@angular/common';
import {HsMiscRecursiveDd} from './recursive-dd.component';
import {NgModule} from '@angular/core';
/**
 * @namespace HsMiscModule
 * @memberOf hs
 */
@NgModule({
  declarations: [HsMiscRecursiveDd],
  imports: [CommonModule, BrowserModule],
  providers: [],
  entryComponents: [HsMiscRecursiveDd],
  exports: [HsMiscRecursiveDd],
})
export class HsMiscModule {}
