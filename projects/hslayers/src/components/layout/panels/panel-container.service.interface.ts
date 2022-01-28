import {ReplaySubject, Subject} from 'rxjs';
import {Type} from '@angular/core';

import {HsPanelComponent} from './panel-component.interface';
import {HsPanelItem} from './panel-item';
import {KeyNumberDict} from '../../../config.service';

export interface HsPanelContainerServiceInterface {
  setPanelWidth?(
    panelWidths: KeyNumberDict,
    componentRefInstance: HsPanelComponent
  );
  panels: HsPanelComponent[];
  panelObserver: ReplaySubject<HsPanelItem>;
  panelDestroyObserver: Subject<any>;

  create(component: Type<any>, data: any): void;

  destroy(component: HsPanelComponent): void;
}
