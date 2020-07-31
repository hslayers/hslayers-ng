import Map from 'ol/Map';
import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';
@Injectable({
  providedIn: 'root',
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
  vectorQueryFeatureDeselection: Subject<any> = new Subject();
  mainPanelChanges: Subject<any> = new Subject(); //replaces 'core.mainpanel_changed'
  measurementStarts: Subject<any> = new Subject(); //replaces 'measure.drawStart'
  measurementEnds: Subject<any> = new Subject(); //replaces 'measure.drawEnd'
  cesiumLoads: Subject<any> = new Subject();
  cesiumResizes: Subject<any> = new Subject();
  zoomTo: Subject<any> = new Subject();
  /**
   * @ngdoc event
   * @name mapExtentChanges
   * @eventType broadcast on $rootScope
   * @description Fires when map extent change (move, zoom, resize). Fires with two parameters: map element and new calculated {@link http://openlayers.org/en/latest/apidoc/ol.html#.Extent extent}
   */
  mapExtentChanges: Subject<any> = new Subject();
  mapCenterSynchronizations: Subject<any> = new Subject();
  mapLibraryChanges: Subject<any> = new Subject();
  cesiumTimeLayerChanges: Subject<any> = new Subject(); //replaces 'cesium.time_layers_changed'
  layoutResizes: Subject<any> = new Subject();
  olMapLoads: Subject<Map> = new Subject(); //replaces 'map.loaded'
  constructor() {}
}
