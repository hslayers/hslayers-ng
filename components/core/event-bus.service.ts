import {Inject, Injectable} from '@angular/core';
import {Subject} from 'rxjs';
@Injectable({
  providedIn: "root",
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
  vectorQueryFeatureSelection: Subject<any> = new Subject();
  mainPanelChanges: Subject<any> = new Subject(); //to replace 'core.mainpanel_changed'
  measurementStarts: Subject<any> = new Subject();
  measurementEnds: Subject<any> = new Subject();

  constructor() {}
}
