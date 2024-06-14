import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {provideHttpClient, withInterceptorsFromDi} from '@angular/common/http';

import {HsDialogContainerComponent} from 'hslayers-ng/common/dialogs';
import {HsLayoutHostDirective} from './layout.directive';
import {HsMapComponent} from './map/map.component';
import {HsMapHostDirective} from './map-host.directive';
import {HsPanelHelpersModule} from 'hslayers-ng/common/panels';
import {HsSidebarModule} from 'hslayers-ng/components/sidebar';
import {HsToastModule} from 'hslayers-ng/common/toast';
import {HslayersComponent} from './hslayers.component';

@NgModule({
  declarations: [HsMapHostDirective, HslayersComponent, HsLayoutHostDirective],
  imports: [
    CommonModule,
    HsMapComponent,
    HsSidebarModule,
    HsPanelHelpersModule,
    HsToastModule,
    HsDialogContainerComponent,
  ],
  exports: [HslayersComponent],
  providers: [provideHttpClient(withInterceptorsFromDi())],
})
export class HslayersModule {}
