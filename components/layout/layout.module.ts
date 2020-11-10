import {BootstrapComponent} from '../../bootstrap.component';
import {CommonModule} from '@angular/common';
import {HsConfirmModule} from './../../common/confirm/confirm.module';
import {HsDialogContainerComponent} from './dialogs/dialog-container.component';
import {HsDialogContainerService} from './dialogs/dialog-container.service';
import {HsDialogHostDirective} from './dialogs/dialog-host.directive';
import {HsLayoutComponent} from './layout.component';
import {HsLayoutService} from './layout.service';
import {NgModule} from '@angular/core';
import {TranslateModule, TranslateStore} from '@ngx-translate/core';

@NgModule({
  declarations: [
    BootstrapComponent,
    HsDialogContainerComponent,
    HsDialogHostDirective,
    HsLayoutComponent,
  ],
  imports: [CommonModule, TranslateModule, HsConfirmModule],
  providers: [HsLayoutService, HsDialogContainerService, TranslateStore],
  entryComponents: [BootstrapComponent, HsDialogContainerComponent],
  exports: [BootstrapComponent, HsDialogContainerComponent, HsLayoutComponent],
})
export class HsLayoutModule {
  ngDoBootstrap(): void {}
}
