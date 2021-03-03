import {Injectable, Type} from '@angular/core';

import {Subject} from 'rxjs';

import {HsDialogComponent} from './dialog-component.interface';
import {HsDialogItem} from './dialog-item';
@Injectable({
  providedIn: 'root',
})
export class HsDialogContainerService {
  dialogs: Array<any> = [];
  dialogObserver: Subject<HsDialogItem> = new Subject();
  dialogDestroyObserver: Subject<any> = new Subject();

  constructor() {}
  create(component: Type<any>, data: any): HsDialogItem {
    const item = new HsDialogItem(component, data);
    this.dialogObserver.next(item);
    return item;
  }

  destroy(component: HsDialogComponent): void {
    this.dialogDestroyObserver.next(component);
  }
}
