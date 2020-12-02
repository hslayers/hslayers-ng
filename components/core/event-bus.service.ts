import Map from 'ol/Map';
import {Injectable} from '@angular/core';
import {BehaviorSubject, Subject} from 'rxjs';

/**
 * HsEventBusService provides observable events which you can subscribe to or fire them
 *
 * @example
 * HsEventBusService.sizeChanges.subscribe((size) => {
 *              doSomethingWith(size);
 * })
 * @example
 * HsEventBusService.layerLoads.next();
 */
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
  /**
   * replaces 'core.mainpanel_changed'
   */
  mainPanelChanges: Subject<any> = new Subject();
  /**
   * replaces 'measure.drawStart'
   */
  measurementStarts: Subject<any> = new Subject();
  /**
   * replaces 'measure.drawEnd'
   */
  measurementEnds: Subject<any> = new Subject();
  cesiumLoads: Subject<any> = new Subject();
  cesiumResizes: Subject<any> = new Subject();
  zoomTo: Subject<any> = new Subject();
  /**
   * @name mapExtentChanges
   * @eventType broadcast on $rootScope
   * @description Fires when map extent change (move, zoom, resize). Fires with two parameters: map element and new calculated {@link http://openlayers.org/en/latest/apidoc/ol.html#.Extent extent}
   */
  mapExtentChanges: Subject<any> = new Subject();
  mapCenterSynchronizations: Subject<any> = new Subject();
  mapLibraryChanges: Subject<any> = new Subject();
  /**
   * replaces 'cesium.time_layers_changed'
   */
  cesiumTimeLayerChanges: Subject<any> = new Subject();
  layoutResizes: Subject<any> = new Subject();
  layoutLoads: Subject<{element: any; innerElement: string}> = new Subject();
  /**
   * replaces 'map.loaded'
   */
  olMapLoads: Subject<Map> = new Subject();
  /**
   * replaces 'compositions.composition_loading'
   */
  compositionLoading: Subject<any> = new Subject();
  /**
   * replaces 'search.resultsReceived'
   */
  searchResultsReceived: Subject<any> = new Subject();
  searchZoomTo: Subject<any> = new Subject();
  clearSearchResults: Subject<any> = new Subject();
  /**
   * replaces 'query.dataUpdated'
   */
  queryDataUpdated: Subject<any> = new Subject();
  /**
   * replaces 'mapClicked'
   */
  mapClicked: Subject<any> = new Subject();
  /**
   * replaces 'ows.filling'
   */
  owsFilling: Subject<{type: any; uri: any; layer: any}> = new Subject();
  /**
   * replaces `ows.${type}_connecting`
   */
  owsConnecting: BehaviorSubject<{
    type: string;
    uri: string;
    layer?: any;
  }> = new BehaviorSubject({type: '', uri: '', layer: null});
  /**
   * replaces 'ows_wmts.capabilities_received'
   * and
   * 'ows_wfs.capabilities_received'
   * and
   * 'ows.capabilities_received'
   */
  owsCapabilitiesReceived: Subject<{
    type: string;
    response: any;
  }> = new Subject();
  constructor() {}
}
