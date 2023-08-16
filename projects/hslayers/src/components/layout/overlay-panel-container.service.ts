import {Injectable} from '@angular/core';

import {HsPanelContainerService} from './panels/panel-container.service';

@Injectable({
  providedIn: 'root',
})
export class HsOverlayPanelContainerService extends HsPanelContainerService {
  constructor() {
    super();
  }
}
