import {BehaviorSubject, Subject} from 'rxjs';
import {Injectable} from '@angular/core';

import Feature from 'ol/Feature';
import {Layer, Vector as VectorLayer} from 'ol/layer';
import {Map} from 'ol';
import {Select} from 'ol/interaction';

import {HsDimensionDescriptor} from '../layermanager/dimensions/dimension.class';
import {
  HsLayerDescriptor,
  HsLayerLoadProgress,
} from '../layermanager/layer-descriptor.interface';

/**
 * HsEventBusService provides observable events which you can subscribe to or fire them
 *
 * @example
 * HsEventBusService.sizeChanges.subscribe((size) =\> \{
 *              doSomethingWith(size);
 * \})
 * @example
 * HsEventBusService.layerLoads.next();
 */
@Injectable({
  providedIn: 'root',
})
export class HsEventBusService {
  sizeChanges: Subject<any> = new Subject();
  /**
   * Fires when map completely reset
   * @event mapResets
   */
  mapResets: Subject<any> = new Subject();
  layerManagerUpdates: Subject<any> = new Subject();
  compositionLoadStarts: Subject<any> = new Subject();
  compositionDeletes: Subject<any> = new Subject();
  /**
   * Fires when composition is loaded or not loaded with Error message
   * @event compositionLoads
   */
  compositionLoads: Subject<any> = new Subject();
  layerRemovals: Subject<any> = new Subject();
  compositionEdits: Subject<any> = new Subject();
  layerAdditions: Subject<any> = new Subject();
  LayerManagerBaseLayerVisibilityChanges: Subject<any> = new Subject();
  LayerManagerLayerVisibilityChanges: Subject<any> = new Subject();
  layerLoads: Subject<any> = new Subject();
  layerLoadings: Subject<{
    layer: Layer;
    progress: HsLayerLoadProgress;
  }> = new Subject();
  /**
   * Fires when time is initially set up in HsLayerDescriptor
   * Used to set up time correctly in layermanager-time-editor
   */
  layerTimeChanges: Subject<{
    layer: HsLayerDescriptor;
    time: string;
  }> = new Subject();
  /**
   * Fires when user enables layer time synchronization in the UI
   * Used to synchronize time in PARAMS across WM(T)S-t layers
   */
  layerTimeSynchronizations: Subject<{
    sync: boolean;
    time?: string;
  }> = new Subject();
  /**
   * Used to listen for changes of dimension settings in layermanager-dimensions component
   */
  layermanagerDimensionChanges: Subject<{
    layer: Layer;
    dimension: HsDimensionDescriptor;
  }> = new Subject();
  vectorQueryFeatureSelection: Subject<{feature: Feature; selector: Select}> =
    new Subject();
  vectorQueryFeatureDeselection: Subject<{feature: Feature; selector: Select}> =
    new Subject();
  /**
   * Fires when current mainpanel change - toggle, change of opened panel.
   * replaces 'core.mainpanel_changed'
   * @event mainPanelChanges
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
   * Fires when map extent change (move, zoom, resize).
   * Fires with two parameters: map element and new calculated {@link http://openlayers.org/en/latest/apidoc/ol.html#.Extent extent}
   * @event mapExtentChanges
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
   * Fires when composition is downloaded from server and parsing begins
   * replaces 'compositions.composition_loading'
   * @event compositionLoading
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
    error?: boolean;
  }> = new Subject();
  /**
   * Fires when layerSelected parameter is found in the URL
   * @event layerSelectedFromUrl
   */
  layerSelectedFromUrl: BehaviorSubject<VectorLayer> = new BehaviorSubject(
    null
  );
  constructor() {}
}
