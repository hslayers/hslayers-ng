import { NgModule } from '@angular/core';
import { HsLayoutServiceProvider } from '../../ajs-upgraded-providers';
import { HsPrintModule } from '../print/print.module';
import { HsLegendModule } from '../legend/legend.module';
import {BootstrapComponent} from '../../bootstrap.component';
/**
 * @namespace hs.layout
 * @memberOf hs
 */
@NgModule({
  declarations: [BootstrapComponent],
  imports: [
    HsPrintModule,
    HsLegendModule
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