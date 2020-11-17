import {HsPanelComponent} from './panel-component.interface';
import {HsPanelItem} from './panel-item';
import {Injectable, Type} from '@angular/core';
import {ReplaySubject, Subject} from 'rxjs';
@Injectable({
  providedIn: 'root',
})
export class HsPanelContainerService {
  panels: Array<any> = [];
  panelObserver: ReplaySubject<HsPanelItem> = new ReplaySubject();
  panelDestroyObserver: Subject<any> = new Subject();

  constructor() {}
  create(component: Type<any>, data: any): void {
    this.panelObserver.next(new HsPanelItem(component, data));
  }

  destroy(component: HsPanelComponent) {
    this.panelDestroyObserver.next(component);
  }
}
