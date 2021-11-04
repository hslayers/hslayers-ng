import {Injectable} from '@angular/core';

import {HsPanelContainerService} from '../../layout/panels/panel-container.service';

@Injectable({
  providedIn: 'root',
})
export class HsLayerWidgetContainerService extends HsPanelContainerService {
  constructor() {
    super();
  }
}
