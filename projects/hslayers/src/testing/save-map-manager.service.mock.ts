import {Subject} from 'rxjs';

import {HsSaveMapManagerParams} from 'hslayers-ng/components/save-map';

export class HsSaveMapManagerServiceMock extends HsSaveMapManagerParams {
  constructor() {
    super();
  }
  panelOpened: Subject<any> = new Subject();
}
