import {CommonModule} from '@angular/common';
import {HttpClientModule} from '@angular/common/http';
import {NgModule} from '@angular/core';

import {HsDialogContainerComponent} from 'hslayers-ng/common/dialogs';
import {HsLayoutHostDirective} from './layout.directive';
import {HsMapHostDirective} from './map-host.directive';
import {HsMapModule} from 'hslayers-ng/components/map';
import {HsPanelHelpersModule} from 'hslayers-ng/common/panels';
import {HsSidebarModule} from 'hslayers-ng/components/sidebar';
import {HsToastModule} from 'hslayers-ng/common/toast';
import {HslayersComponent} from './hslayers.component';

@NgModule({
  declarations: [HsMapHostDirective, HslayersComponent, HsLayoutHostDirective],
  imports: [
    HttpClientModule,
    CommonModule,
    HsMapModule,
    HsSidebarModule,
    HsPanelHelpersModule,
    HsToastModule,
    HsDialogContainerComponent,
  ],
  exports: [HslayersComponent],
})
export class HslayersModule {}
