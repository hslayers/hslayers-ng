import {BootstrapComponent} from '../../bootstrap.component';
import {CommonModule} from '@angular/common';
import {HsConfirmModule} from './../../common/confirm/confirm.module';
import {HsDialogContainerComponent} from './dialogs/dialog-container.component';
import {HsDialogContainerService} from './dialogs/dialog-container.service';
import {HsDialogHostDirective} from './dialogs/dialog-host.directive';
import {HsLayoutServiceProvider} from '../../ajs-upgraded-providers';
import {NgModule} from '@angular/core';
import {TranslateModule, TranslateStore} from '@ngx-translate/core';
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
  imports: [CommonModule, TranslateModule, HsConfirmModule],
  providers: [
    HsLayoutServiceProvider,
    HsDialogContainerService,
    TranslateStore,
  ],
  entryComponents: [BootstrapComponent, HsDialogContainerComponent],
  exports: [BootstrapComponent, HsDialogContainerComponent],
})
export class HsLayoutModule {
  ngDoBootstrap(): void {}
}
