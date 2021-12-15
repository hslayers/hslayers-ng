import {BehaviorSubject, Subject} from 'rxjs';

import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import {Geometry} from 'ol/geom';

export class HsEventBusServiceMock {
  layerAdditions: Subject<any> = new Subject();
  layerDimensionDefinitionChanges: Subject<any> = new Subject();
  layerSelectedFromUrl: BehaviorSubject<VectorLayer<VectorSource<Geometry>>> =
    new BehaviorSubject(null);
  mainPanelChanges: Subject<any> = new Subject();
  layerManagerUpdates: Subject<any> = new Subject();
  mapResets: Subject<any> = new Subject();
  constructor() {}
}
