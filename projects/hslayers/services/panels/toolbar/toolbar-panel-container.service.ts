import {HsPanelContainerService} from '../panel-container.service';
import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class HsToolbarPanelContainerService extends HsPanelContainerService {
  constructor() {
    super();
  }
}
