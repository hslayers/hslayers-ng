import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {provideHttpClient, withInterceptorsFromDi} from '@angular/common/http';

import {HsDialogContainerComponent} from 'hslayers-ng/common/dialogs';
import {HsLayoutHostDirective} from './layout.directive';
import {HsMapComponent} from './map/map.component';
import {HsMapHostDirective} from './map-host.directive';
import {HsPanelHelpersModule} from 'hslayers-ng/common/panels';
import {HsSidebarModule} from 'hslayers-ng/components/sidebar';
import {HslayersComponent} from './hslayers.component';
import {HsToastComponent} from 'hslayers-ng/common/toast';

@NgModule({
  declarations: [HsMapHostDirective, HslayersComponent, HsLayoutHostDirective],
  imports: [
    CommonModule,
    HsMapComponent,
    HsSidebarModule,
    HsPanelHelpersModule,
    HsToastComponent,
    HsDialogContainerComponent,
  ],
  exports: [HslayersComponent],
  providers: [provideHttpClient(withInterceptorsFromDi())],
})
export class HslayersModule {}
