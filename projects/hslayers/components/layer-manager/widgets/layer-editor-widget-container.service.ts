import {HsPanelContainerService} from 'hslayers-ng/services/panels';
import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class HsLayerEditorWidgetContainerService extends HsPanelContainerService {
  constructor() {
    super();
  }
}
