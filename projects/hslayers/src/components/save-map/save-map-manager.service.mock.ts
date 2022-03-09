import {Subject} from 'rxjs';

import {HsSaveMapManagerParams} from './save-map-manager.service';

export class HsSaveMapManagerServiceMock {
  apps: {
    [id: string]: HsSaveMapManagerParams;
  } = {
    default: new HsSaveMapManagerParams(),
  };
  constructor() {}
  panelOpened: Subject<any> = new Subject();
  endpointSelected: Subject<any> = new Subject();
  get(app: string): HsSaveMapManagerParams {
    if (this.apps[app ?? 'default'] == undefined) {
      this.apps[app ?? 'default'] = new HsSaveMapManagerParams();
    }
    return this.apps[app ?? 'default'];
  }
  init() {
    return true;
  }
}
