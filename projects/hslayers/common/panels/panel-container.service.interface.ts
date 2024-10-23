import {ReplaySubject, Subject} from 'rxjs';
import {Type, WritableSignal} from '@angular/core';

import {HsPanelComponent} from './panel-component.interface';
import {HsPanelItem} from './panel-item';
import {KeyNumberDict} from 'hslayers-ng/config';

export interface HsPanelContainerServiceInterface {
  panels: WritableSignal<HsPanelComponent[]>;
  panelObserver: ReplaySubject<HsPanelItem>;
  panelDestroyObserver: Subject<any>;
  setPanelWidth?(
    panelWidths: KeyNumberDict,
    componentRefInstance: HsPanelComponent,
  );
  create(component: Type<any>, data: any): void;

  destroy(component: HsPanelComponent): void;
}
