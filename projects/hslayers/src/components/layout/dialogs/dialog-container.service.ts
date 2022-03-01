import {Injectable, Type} from '@angular/core';

import {Subject} from 'rxjs';

import {HsDialogComponent} from './dialog-component.interface';
import {HsDialogItem} from './dialog-item';

class HsDialogContainerParams {
  dialogs: Array<any> = [];
  dialogObserver: Subject<HsDialogItem> = new Subject();
  dialogDestroyObserver: Subject<any> = new Subject();
}

@Injectable({
  providedIn: 'root',
})
export class HsDialogContainerService {
  apps: {
    [key: string]: HsDialogContainerParams;
  } = {default: new HsDialogContainerParams()};

  constructor() {}

  get(app: string): HsDialogContainerParams {
    if (this.apps[app ?? 'default'] == undefined) {
      this.apps[app ?? 'default'] = new HsDialogContainerParams();
    }
    return this.apps[app ?? 'default'];
  }

  create(component: Type<any>, data: any, app: string): HsDialogItem {
    const item = new HsDialogItem(component, data, app);
    this.get(app).dialogObserver.next(item);
    return item;
  }

  destroy(component: HsDialogComponent, app: string): void {
    this.get(app).dialogDestroyObserver.next(component);
  }
}
