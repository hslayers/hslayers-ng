import {NgModule} from '@angular/core';

import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';

import {HsPanelContainerComponent} from './panel-container.component';
import {HsPanelHostDirective} from './panel-host.directive';
@NgModule({
  declarations: [HsPanelHostDirective, HsPanelContainerComponent],
  imports: [NgbDropdownModule],
  exports: [HsPanelContainerComponent],
})
export class HsPanelHelpersModule {}
