import {Subject} from 'rxjs';

import {HsEndpoint} from './../../common/endpoints/endpoint.interface';
import {HsSaveMapManagerParams} from './feature-services/save-map-manager.service';

export class HsSaveMapManagerServiceMock {
  apps: {
    [id: string]: HsSaveMapManagerParams;
  } = {
    default: new HsSaveMapManagerParams(),
  };
  constructor() {}
  panelOpened: Subject<any> = new Subject();
  endpointSelected: Subject<HsEndpoint> = new Subject();
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
