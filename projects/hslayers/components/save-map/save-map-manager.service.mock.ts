import {Subject} from 'rxjs';

import {HsSaveMapManagerParams} from './save-map-manager.service';

export class HsSaveMapManagerServiceMock extends HsSaveMapManagerParams {
  constructor() {
    super();
  }
  panelOpened: Subject<any> = new Subject();
}
