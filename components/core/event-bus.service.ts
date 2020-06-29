import { Injectable, Inject } from '@angular/core';
import { Subject } from 'rxjs';
@Injectable({
  providedIn: 'any',
})
export class HsEventBusService {
  sizeChanges: Subject<any> = new Subject();
  mapResets: Subject<any> = new Subject();
  layerManagerUpdates: Subject<any> = new Subject();
  compositionLoadStarts: Subject<any> = new Subject();
  compositionDeletes: Subject<any> = new Subject();
  compositionLoads: Subject<any> = new Subject();
  layerRemovals: Subject<any> = new Subject();
  compositionEdits: Subject<any> = new Subject();
  layerAdditions: Subject<any> = new Subject();
  LayerManagerBaseLayerVisibilityChanges: Subject<any> = new Subject();
  layerLoads: Subject<any> = new Subject();
  layerLoadings: Subject<any> = new Subject();
  layerTimeChanges: Subject<any> = new Subject();
  layermanagerDimensionChanges: Subject<any> = new Subject();

  constructor() {

  }
}