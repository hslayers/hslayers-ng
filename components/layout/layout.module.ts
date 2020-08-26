import {BootstrapComponent} from '../../bootstrap.component';
import {CommonModule} from '@angular/common';
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
  imports: [CommonModule],
  providers: [HsLayoutServiceProvider, HsDialogContainerService],
  entryComponents: [BootstrapComponent, HsDialogContainerComponent],
  exports: [BootstrapComponent],
})
export class HsLayoutModule {
  ngDoBootstrap(): void {}
}
