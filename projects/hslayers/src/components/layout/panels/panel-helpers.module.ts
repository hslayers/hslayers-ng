import {NgModule} from '@angular/core';

import {HsPanelBaseComponent} from './panel-base.component';
import {HsPanelContainerComponent} from './panel-container.component';
import {HsPanelHeaderComponent} from './panel-header.component';
import {HsPanelHostDirective} from './panel-host.directive';
@NgModule({
  declarations: [
    HsPanelHeaderComponent,
    HsPanelHostDirective,
    HsPanelContainerComponent,
    HsPanelBaseComponent,
  ],
  imports: [],
  exports: [
    HsPanelHeaderComponent,
    HsPanelContainerComponent,
    HsPanelBaseComponent,
  ],
})
export class HsPanelHelpersModule {}
