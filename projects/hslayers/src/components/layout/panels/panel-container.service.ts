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
  panels: Array<any> = [];
  panelObserver: ReplaySubject<HsPanelItem> = new ReplaySubject();
  panelCreated: Subject<{panelRefInstance: HsPanelComponent; host: any}> =
    new Subject();
  panelDestroyObserver: Subject<any> = new Subject();

  constructor() {}

  /**
   * Create new dynamic panels. They are replayed in the PanelContainerComponent
   * in case of race conditions existing where panels are created before the
   * container component is even added to the dom.
   * @param component PanelComponent class
   * @param data Extra data to give the new panel
   */
  create(component: Type<any>, data: any): void {
    this.panelObserver.next(new HsPanelItem(component, data));
  }

  /**
   * Crate panels for inside a specific element (owner) which might
   * be recreated and destroyed in ngFor loop for example.
   * @param owner Instance of component where to place the panel container. This is needed because
   * all the container share the same angular HsPanelContainerService with only one ReplaySubject. Example:
   * <hs-panel-container [service]="hsLayerWidgetContainerService" [containerComponent]="this">
   * @param component PanelComponent class
   * @param data Extra data to give the new panel
   */
  createWithOwner(owner, component: Type<any>, data: any): void {
    this.panelObserver.next(new HsPanelItem(component, data, owner));
  }

  destroy(component: HsPanelComponent): void {
    this.panelDestroyObserver.next(component);
    this.panels.splice(this.panels.indexOf(component), 1);
  }
}
