import { NgModule } from '@angular/core';
import { HsLayoutServiceProvider } from '../../ajs-upgraded-providers';
import { HsPrintModule } from '../print/print.module';
/**
 * @namespace hs.layout
 * @memberOf hs
 */
@NgModule({
  declarations: [],
  imports: [
    HsPrintModule
  ],
  providers: [
    HsLayoutServiceProvider
  ],
  entryComponents: [],
  exports: [],
})
export class HsLayoutModule {}