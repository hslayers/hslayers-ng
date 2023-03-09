import {Injectable, Type} from '@angular/core';

import {ReplaySubject, Subject} from 'rxjs';

import {HsDialogComponent} from './dialog-component.interface';
import {HsDialogItem} from './dialog-item';

@Injectable({
  providedIn: 'root',
})
export class HsDialogContainerService {
  dialogs: Array<any> = [];
  dialogObserver: ReplaySubject<HsDialogItem> = new ReplaySubject();
  dialogDestroyObserver: Subject<any> = new Subject();

  constructor() {}

  cleanup() {
    console.warn('HsDialogContainerService clean up, fix me');
  }

  create(component: Type<any>, data: any): HsDialogItem {
    const item = new HsDialogItem(component, data);
    this.dialogObserver.next(item);
    return item;
  }

  destroy(component: HsDialogComponent): void {
    if (component.cleanup) {
      component.cleanup();
    }
    const dialogCollection = this.dialogs;
    const dialogIx = dialogCollection.findIndex((d) => d == component);
    if (dialogIx > -1) {
      dialogCollection.splice(dialogIx, 1);
    }
    this.dialogDestroyObserver.next(component);
  }
}
