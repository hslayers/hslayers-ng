import {CUSTOM_ELEMENTS_SCHEMA, DoBootstrap, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {HsConfirmModule} from './../../common/confirm/confirm.module';
import {HsDialogContainerComponent} from './dialogs/dialog-container.component';
import {HsDialogHostDirective} from './dialogs/dialog-host.directive';
import {HsGeolocationModule} from '../geolocation/geolocation.module';
import {HsInfoModule} from '../info/info.module';
import {HsLanguageModule} from '../language/language.module';
import {HsLayoutComponent} from './layout.component';
import {HsLayoutHostDirective} from './layout.directive';
import {HsMapHostDirective} from './map-host.directive';
import {HsMapModule} from '../map/map.module';
import {HsPanelHelpersModule} from './panels/panel-helpers.module';
import {HsSidebarModule} from '../sidebar/sidebar.module';
import {HsToastModule} from './toast/toast.module';
import {HsToolbarModule} from '../toolbar/toolbar.module';

import {TranslateModule} from '@ngx-translate/core';

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
    TranslateModule,
    HsConfirmModule,
    HsMapModule,
    HsGeolocationModule,
    HsToolbarModule,
    HsInfoModule,
    HsSidebarModule,
    HsLanguageModule,
    HsPanelHelpersModule,
    HsToastModule,
  ],
  entryComponents: [HsDialogContainerComponent, HsLayoutComponent],
  exports: [HsDialogContainerComponent, HsLayoutComponent],
})
export class HsLayoutModule implements DoBootstrap {
  ngDoBootstrap(): void {}
}
