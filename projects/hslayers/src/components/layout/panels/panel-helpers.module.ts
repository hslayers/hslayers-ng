import {NgModule} from '@angular/core';

import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';

import {HsPanelBaseComponent} from './panel-base.component';
import {HsPanelContainerComponent} from './panel-container.component';
import {HsPanelHostDirective} from './panel-host.directive';
@NgModule({
  declarations: [
    HsPanelHostDirective,
    HsPanelContainerComponent,
    HsPanelBaseComponent,
  ],
  imports: [NgbDropdownModule],
  exports: [HsPanelContainerComponent, HsPanelBaseComponent],
})
export class HsPanelHelpersModule {}
