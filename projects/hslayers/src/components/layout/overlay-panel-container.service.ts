import {HsPanelContainerService} from './panels/panel-container.service';
import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class HsOverlayPanelContainerService extends HsPanelContainerService {
  constructor() {
    super();
  }
}
