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
    data.app = app;
    const item = new HsDialogItem(component, data, app);
    this.get(app).dialogObserver.next(item);
    return item;
  }

  destroy(component: HsDialogComponent, app: string): void {
    if (component.cleanup) {
      component.cleanup();
    }
    const dialogCollection = this.get(app).dialogs;
    const dialogIx = dialogCollection.findIndex((d) => d == component);
    if (dialogIx > -1) {
      dialogCollection.splice(dialogIx, 1);
    }
    this.get(app).dialogDestroyObserver.next(component);
  }
}
