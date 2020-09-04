import {HsDialogComponent} from './dialog-component.interface';
import {HsDialogItem} from './dialog-item';
import {Injectable, Type} from '@angular/core';
import {ReplaySubject, Subject} from 'rxjs';
@Injectable({
  providedIn: 'root',
})
export class HsDialogContainerService {
  dialogs: Array<any> = [];
  dialogObserver: ReplaySubject<HsDialogItem> = new ReplaySubject();
  dialogDestroyObserver: Subject<any> = new Subject();

  constructor() {}
  create(component: Type<any>, data: any): HsDialogItem {
    const item = new HsDialogItem(component, data);
    this.dialogObserver.next(item);
    return item;
  }

  destroy(component: HsDialogComponent) {
    this.dialogDestroyObserver.next(component);
  }
}
