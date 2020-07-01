import { NgModule } from '@angular/core';
import { HsLayoutServiceProvider } from '../../ajs-upgraded-providers';
import {BootstrapComponent} from '../../bootstrap.component';
import { HsDialogContainerComponent } from './dialog-container.component';
import { HsDialogContainerService } from './dialog-container.service';
import { BrowserModule } from '@angular/platform-browser';
import { HsDialogHostDirective } from './dialog-host.directive';
/**
 * @namespace hs.layout
 * @memberOf hs
 */
@NgModule({
  declarations: [BootstrapComponent, HsDialogContainerComponent, HsDialogHostDirective],
  imports: [
    BrowserModule
  ],
  providers: [
    HsLayoutServiceProvider, HsDialogContainerService
  ],
  entryComponents: [BootstrapComponent, HsDialogContainerComponent],
  exports: [BootstrapComponent]
})
export class HsLayoutModule {
  ngDoBootstrap(){}
}