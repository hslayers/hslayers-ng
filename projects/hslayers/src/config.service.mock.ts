import {Subject} from 'rxjs';

import {HsConfig} from './config.service';

export class HsConfigMock {
  configChanges?: Subject<HsConfig> = new Subject();
  constructor() {}
}
