import {Component, ViewRef} from '@angular/core';

import {HsLayoutService} from '../layout.service';
import {HsPanelComponent} from './panel-component.interface';

@Component({
  template: '<div></div>',
})
export class HsPanelBaseComponent implements HsPanelComponent {
  name: string;
  viewRef: ViewRef;
  data: any;
  constructor(public hsLayoutService: HsLayoutService) {}
  isVisible(): boolean {
    return this.hsLayoutService.panelVisible(this.name);
  }
}
