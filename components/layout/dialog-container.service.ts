import { Injectable, Type } from '@angular/core';
import { HsDialogItem } from './dialog-item';
import { Subject } from 'rxjs';
import { HsDialogComponent } from './dialog-component.interface';
@Injectable({
  providedIn: 'root',
})
export class HsDialogContainerService {
    dialogs: Array<any> = [];
    dialogObserver: Subject<any> = new Subject();
    constructor(){

    }
    create(component: Type<any>, data: any){
      this.dialogObserver.next(new HsDialogItem(component, data));
    }
}