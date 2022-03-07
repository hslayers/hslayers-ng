import {ReplaySubject, Subject} from 'rxjs';
import {Type} from '@angular/core';

import {HsPanelComponent} from './panel-component.interface';
import {HsPanelItem} from './panel-item';
import {KeyNumberDict} from '../../../config.service';

export class HsPanelContainerParams {
  panels: HsPanelComponent[] = [];
  panelObserver: ReplaySubject<HsPanelItem> = new ReplaySubject();
  panelDestroyObserver: Subject<any> = new Subject();
}

export interface HsPanelContainerServiceInterface {
  apps: {[id: string]: HsPanelContainerParams};
  setPanelWidth?(
    panelWidths: KeyNumberDict,
    componentRefInstance: HsPanelComponent
  );
  get(app: string);
  create(component: Type<any>, app: string, data: any): void;

  destroy(component: HsPanelComponent, app: string): void;
}
