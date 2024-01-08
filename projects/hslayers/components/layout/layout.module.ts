import {CUSTOM_ELEMENTS_SCHEMA, DoBootstrap, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';

import {HsConfirmModule} from 'hslayers-ng/common/confirm';
import {HsLayoutComponent} from './layout.component';
import {HsLayoutHostDirective} from './layout.directive';
import {HsMapHostDirective} from './map-host.directive';
import {HsMapModule} from 'hslayers-ng/components/map';
import {HsPanelHelpersModule} from 'hslayers-ng/common/panels';
import {HsSidebarModule} from 'hslayers-ng/components/sidebar';
import {HsToastModule} from 'hslayers-ng/common/toast';

@NgModule({
  declarations: [HsMapHostDirective, HsLayoutComponent, HsLayoutHostDirective],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    HsConfirmModule,
    HsMapModule,
    HsSidebarModule,
    HsPanelHelpersModule,
    HsToastModule,
  ],
  exports: [HsLayoutComponent],
})
export class HsLayoutModule implements DoBootstrap {
  ngDoBootstrap(): void {}
}
