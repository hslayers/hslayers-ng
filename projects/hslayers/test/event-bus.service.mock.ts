import {BehaviorSubject, Subject} from 'rxjs';

import Feature from 'ol/Feature';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';

export class HsEventBusServiceMock {
  layerAdditions: Subject<any> = new Subject();
  layerDimensionDefinitionChanges: Subject<any> = new Subject();
  layerSelectedFromUrl: BehaviorSubject<VectorLayer<VectorSource<Feature>>> =
    new BehaviorSubject(null);
  mainPanelChanges: Subject<any> = new Subject();
  layerManagerUpdates: Subject<any> = new Subject();
  mapResets: Subject<any> = new Subject();
  mapEventHandlersSet: Subject<any> = new Subject();
  resetWfsFilter: Subject<any> = new Subject();
  constructor() {}
}
