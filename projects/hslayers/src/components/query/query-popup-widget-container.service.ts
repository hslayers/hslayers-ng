import {Injectable} from '@angular/core';

import {HsPanelContainerService} from '../layout/panels/panel-container.service';

@Injectable({
  providedIn: 'root',
})
export class HsQueryPopupWidgetContainerService extends HsPanelContainerService {
  constructor() {
    super();
  }
}
