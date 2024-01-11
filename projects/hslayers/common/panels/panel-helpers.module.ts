import {NgModule} from '@angular/core';

import {HsPanelContainerComponent} from './panel-container.component';
import {HsPanelHostDirective} from './panel-host.directive';
@NgModule({
  declarations: [HsPanelHostDirective, HsPanelContainerComponent],
  imports: [],
  exports: [HsPanelContainerComponent],
})
export class HsPanelHelpersModule {}
