import {Component, ViewRef} from '@angular/core';
import {HsLayoutService} from '../layout/layout.service';
import {HsPanelComponent} from '../layout/panels/panel-component.interface';

@Component({
  template: '<div></div>',
})
export class HsToolbarPanelBaseComponent implements HsPanelComponent {
  name: string;
  viewRef: ViewRef;
  data: any;
  constructor(public hsLayoutService: HsLayoutService) {}
  isVisible(): boolean {
    return this.hsLayoutService.componentEnabled(this.name);
  }
}
