import {HsPanelContainerService} from '../panel-container.service';
import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class HsOverlayContainerService extends HsPanelContainerService {
  constructor() {
    super();
  }
}
