import {HsPanelContainerService} from '../../layout/panels/panel-container.service';
import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class HsLayerEditorWidgetContainerService extends HsPanelContainerService {
  constructor() {
    super();
  }
}
