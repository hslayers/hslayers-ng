import {BootstrapComponent} from '../../bootstrap.component';
import {BrowserModule} from '@angular/platform-browser';
import {HsDialogContainerComponent} from './dialogs/dialog-container.component';
import {HsDialogContainerService} from './dialogs/dialog-container.service';
import {HsDialogHostDirective} from './dialogs/dialog-host.directive';
import {HsLayoutServiceProvider} from '../../ajs-upgraded-providers';
import {NgModule} from '@angular/core';
/**
 * @namespace hs.layout
 * @memberOf hs
 */
@NgModule({
  declarations: [
    BootstrapComponent,
    HsDialogContainerComponent,
    HsDialogHostDirective,
  ],
  imports: [BrowserModule],
  providers: [HsLayoutServiceProvider, HsDialogContainerService],
  entryComponents: [BootstrapComponent, HsDialogContainerComponent],
  exports: [BootstrapComponent],
})
export class HsLayoutModule {
  ngDoBootstrap(): void {}
}
