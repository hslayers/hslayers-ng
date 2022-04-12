import {Component, ViewRef} from '@angular/core';

import {HsPanelComponent} from '../layout/panels/panel-component.interface';
@Component({
  template: '<div></div>',
})
export class HsQueryPopupWidgetBaseComponent implements HsPanelComponent {
  name: string; //This could be used to enable/disable widgets by name on HsConfig level
  viewRef: ViewRef;
  data: any;

  constructor() {}

  /**
   * Check if widget is visible
   * @returns True if the widget is visible, false otherwise
   */
  isVisible(): boolean {
    return true;
  }
}
