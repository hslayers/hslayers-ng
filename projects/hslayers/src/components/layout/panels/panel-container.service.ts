import {HsPanelComponent} from './panel-component.interface';
import {HsPanelContainerServiceInterface} from './panel-container.service.interface';
import {HsPanelItem} from './panel-item';
import {Injectable, Type} from '@angular/core';
import {ReplaySubject, Subject} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class HsPanelContainerService
  implements HsPanelContainerServiceInterface
{
  panelObserver: ReplaySubject<HsPanelItem> = new ReplaySubject();
  panelDestroyObserver: Subject<any> = new Subject();

  constructor() {}

  /**
   * Create new dynamic panels. They are replayed in the PanelContainerComponent
   * in case of race conditions existing where panels are created before the
   * container component is even added to the dom.
   * @param component PanelComponent class
   * @param data Extra data to give the new panel
   * @param panelObserver ReplaySubject to which you need to add the panel components. This is used when panels in this service are used only sometimes (for particular layers)
   */
  create(
    component: Type<any>,
    data: any,
    panelObserver?: ReplaySubject<HsPanelItem>
  ): void {
    (panelObserver ?? this.panelObserver).next(
      new HsPanelItem(component, data)
    );
  }

  destroy(component: HsPanelComponent): void {
    this.panelDestroyObserver.next(component);
  }
}
