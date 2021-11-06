import {Component} from '@angular/core';

import {
  HsPanelComponent,
  HsQueryPopupWidgetBaseComponent,
} from 'hslayers-ng/src/public-api';

@Component({
  selector: 'popup-widget',
  templateUrl: './popup-widget.html',
})
export class PopupWidgetComponent
  extends HsQueryPopupWidgetBaseComponent
  implements HsPanelComponent
{
  constructor() {
    super();
  }
}
