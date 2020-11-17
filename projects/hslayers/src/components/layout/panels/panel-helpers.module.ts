import {HsPanelContainerComponent} from './panel-container.component';
import {HsPanelContainerService} from './panel-container.service';
import {HsPanelHeaderComponent} from './layout-panel-header.component';
import {HsPanelHostDirective} from './panel-host.directive';
import {NgModule} from '@angular/core';
/**
 * @namespace hs.panelhelpers
 * @memberOf hs
 */
@NgModule({
  declarations: [
    HsPanelHeaderComponent,
    HsPanelHostDirective,
    HsPanelContainerComponent,
  ],
  imports: [],
  providers: [HsPanelContainerService],
  entryComponents: [HsPanelHeaderComponent, HsPanelContainerComponent],
  exports: [HsPanelHeaderComponent, HsPanelContainerComponent],
})
export class HsPanelHelpersModule {}
