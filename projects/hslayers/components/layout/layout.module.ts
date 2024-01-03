import {CUSTOM_ELEMENTS_SCHEMA, DoBootstrap, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';

import {HsConfirmModule} from 'hslayers-ng/common/confirm';
import {HsDialogContainerComponent} from './dialogs/dialog-container.component';
import {HsDialogHostDirective} from './dialogs/dialog-host.directive';
import {HsLayoutComponent} from './layout.component';
import {HsLayoutHostDirective} from './layout.directive';
import {HsMapHostDirective} from './map-host.directive';
import {HsMapModule} from '../map/map.module';
import {HsPanelHelpersModule} from './panels/panel-helpers.module';
import {HsSidebarModule} from '../sidebar/sidebar.module';
import {HsToastModule} from './toast/toast.module';

@NgModule({
  declarations: [
    HsDialogContainerComponent,
    HsDialogHostDirective,
    HsMapHostDirective,
    HsLayoutComponent,
    HsLayoutHostDirective,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    HsConfirmModule,
    HsMapModule,
    HsSidebarModule,
    HsPanelHelpersModule,
    HsToastModule,
  ],
  exports: [HsDialogContainerComponent, HsLayoutComponent],
})
export class HsLayoutModule implements DoBootstrap {
  ngDoBootstrap(): void {}
}
