import {HsPanelContainerService} from '../layout/public-api';
import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class HsToolbarPanelContainerService extends HsPanelContainerService {
  constructor() {
    super();
  }
}
