import {HsPanelComponent} from './panel-component.interface';
import {HsPanelItem} from './panel-item';
import {ReplaySubject, Subject} from 'rxjs';
import {Type} from '@angular/core';

export interface HsPanelContainerServiceInterface {
  panelObserver: ReplaySubject<HsPanelItem>;
  panelDestroyObserver: Subject<any>;

  create(component: Type<any>, data: any): void;

  destroy(component: HsPanelComponent): void;
}
