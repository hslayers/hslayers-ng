import {Injectable, Type} from '@angular/core';

import {ReplaySubject, Subject} from 'rxjs';

import {HsDialogComponent} from './dialog-component.interface';
import {HsDialogItem} from './dialog-item';

class HsDialogContainerParams {
  dialogs: Array<any> = [];
  dialogObserver: ReplaySubject<HsDialogItem> = new ReplaySubject();
  dialogDestroyObserver: Subject<any> = new Subject();
}

@Injectable({
  providedIn: 'root',
})
export class HsDialogContainerService {
  apps: {
    [key: string]: HsDialogContainerParams;
  } = {};

  constructor() {}

  cleanup(app?: string) {
    if (app) {
      delete this.apps[app];
    } else {
      this.apps = {};
    }
  }

  get(app: string = 'default'): HsDialogContainerParams {
    if (this.apps[app] === undefined) {
      this.apps[app] = new HsDialogContainerParams();
    }
    return this.apps[app];
  }

  create(
    component: Type<any>,
    data: any,
    app: string = 'default'
  ): HsDialogItem {
    data.app = app;
    const item = new HsDialogItem(component, data, app);
    this.get(app).dialogObserver.next(item);
    return item;
  }

  destroy(component: HsDialogComponent, app: string = 'default'): void {
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
