import { NgModule } from '@angular/core';
import { HsLayoutServiceProvider } from '../../ajs-upgraded-providers';
import {BootstrapComponent} from '../../bootstrap.component';
/**
 * @namespace hs.layout
 * @memberOf hs
 */
@NgModule({
  declarations: [BootstrapComponent],
  imports: [
  ],
  providers: [
    HsLayoutServiceProvider
  ],
  entryComponents: [BootstrapComponent],
  exports: [BootstrapComponent]
})
export class HsLayoutModule {
  ngDoBootstrap(){}
}