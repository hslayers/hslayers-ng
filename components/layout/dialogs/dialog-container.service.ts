import {HsDialogComponent} from './dialog-component.interface';
import {HsDialogItem} from './dialog-item.class';
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
  create(component: Type<any>, data: any): void {
    this.dialogObserver.next(new HsDialogItem(component, data));
  }

  destroy(component: HsDialogComponent) {
    this.dialogDestroyObserver.next(component);
  }
}
