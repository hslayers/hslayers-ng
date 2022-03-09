import {Subject} from 'rxjs';

import {HsConfig, HsConfigObject} from './config.service';

export class HsConfigMock {
  apps: {[id: string]: HsConfigObject} = {
    default: new HsConfigObject(),
  };
  configChanges?: Subject<HsConfig> = new Subject();
  constructor() {}

  get(): HsConfigObject {
    return this.apps['default'];
  }
}
