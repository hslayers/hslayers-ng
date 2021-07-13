import {BehaviorSubject, Subject} from 'rxjs';

import VectorLayer from 'ol/layer/Vector';

export class HsEventBusServiceMock {
  layerAdditions: Subject<any> = new Subject();
  layerSelectedFromUrl: BehaviorSubject<VectorLayer> = new BehaviorSubject(
    null
  );
  mainPanelChanges: Subject<any> = new Subject();
  constructor() {}
}
