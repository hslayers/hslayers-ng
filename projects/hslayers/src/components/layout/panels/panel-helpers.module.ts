import {HsPanelContainerComponent} from './panel-container.component';
import {HsPanelHeaderComponent} from './layout-panel-header.component';
import {HsPanelHostDirective} from './panel-host.directive';
import {NgModule} from '@angular/core';
@NgModule({
  declarations: [
    HsPanelHeaderComponent,
    HsPanelHostDirective,
    HsPanelContainerComponent,
  ],
  imports: [],
  entryComponents: [HsPanelHeaderComponent, HsPanelContainerComponent],
  exports: [HsPanelHeaderComponent, HsPanelContainerComponent],
})
export class HsPanelHelpersModule {}
