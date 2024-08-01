import {BehaviorSubject, Subject} from 'rxjs';

import {Feature} from 'ol';
import {Vector as VectorLayer} from 'ol/layer';
import {Vector as VectorSource} from 'ol/source';

export class HsEventBusServiceMock {
  layerAdditions: Subject<any> = new Subject();
  layerDimensionDefinitionChanges: Subject<any> = new Subject();
  layerSelectedFromUrl: BehaviorSubject<VectorLayer<VectorSource<Feature>>> =
    new BehaviorSubject(null);
  mainPanelChanges: Subject<any> = new Subject();
  layerManagerUpdates: Subject<any> = new Subject();
  mapResets: Subject<any> = new Subject();
  constructor() {}
}
