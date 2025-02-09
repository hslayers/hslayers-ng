/* eslint-disable @angular-eslint/component-selector */
import {Component} from '@angular/core';

import {HsPanelComponent} from 'hslayers-ng/common/panels';
import {HsQueryPopupWidgetBaseComponent} from 'hslayers-ng/common/query-popup';
@Component({
  selector: 'popup-widget',
  templateUrl: './popup-widget.component.html',
  standalone: false,
})
export class PopupWidgetComponent
  extends HsQueryPopupWidgetBaseComponent
  implements HsPanelComponent
{
  constructor() {
    super();
  }
}
