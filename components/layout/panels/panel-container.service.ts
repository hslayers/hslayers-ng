import {HsPanelComponent} from './panel-component';
import {HsPanelItem} from './panel-item.class';
import {Injectable, Type} from '@angular/core';
import {Subject} from 'rxjs';
@Injectable({
  providedIn: 'root',
})
export class HsPanelContainerService {
  panels: Array<any> = [];
  panelObserver: Subject<any> = new Subject();
  panelDestroyObserver: Subject<any> = new Subject();

  constructor() {}
  create(component: Type<any>, data: any): void {
    this.panelObserver.next(new HsPanelItem(component, data));
  }

  destroy(component: HsPanelComponent){
    this.panelDestroyObserver.next(component);
  }
}
