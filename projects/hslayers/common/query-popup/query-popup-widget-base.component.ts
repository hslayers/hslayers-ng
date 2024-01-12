import {BehaviorSubject} from 'rxjs';
import {Component, ViewRef} from '@angular/core';

import {HsPanelComponent} from 'hslayers-ng/common/panels';
@Component({
  template: '<div></div>',
})
export class HsQueryPopupWidgetBaseComponent implements HsPanelComponent {
  name: string; //This could be used to enable/disable widgets by name on HsConfig level
  viewRef: ViewRef;
  data: any;
  isVisible$ = new BehaviorSubject<boolean>(false);

  constructor() {}

  /**
   * Check if widget is visible
   * @returns True if the widget is visible, false otherwise
   */
  isVisible(): boolean {
    return true;
  }
}
