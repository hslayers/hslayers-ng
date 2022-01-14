import {BehaviorSubject, Subject} from 'rxjs';
import {Injectable} from '@angular/core';

import Feature from 'ol/Feature';
import {Geometry} from 'ol/geom';
import {Layer, Vector as VectorLayer} from 'ol/layer';
import {Map} from 'ol';
import {Select} from 'ol/interaction';
import {Source} from 'ol/source';

import {HsDimensionDescriptor} from '../../common/get-capabilities/dimension';
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
  mapResets: Subject<void> = new Subject();
  layerManagerUpdates: Subject<Layer<Source> | void> = new Subject();
  compositionLoadStarts: Subject<any> = new Subject();
  compositionDeletes: Subject<any> = new Subject();
  /**
   * Fires when composition is loaded or not loaded with Error message
   * @event compositionLoads
   */
  compositionLoads: Subject<any> = new Subject();
  layerRemovals: Subject<Layer<Source>> = new Subject();
  compositionEdits: Subject<void> = new Subject();
  layerAdditions: Subject<any> = new Subject();
  LayerManagerBaseLayerVisibilityChanges: Subject<any> = new Subject();
  LayerManagerLayerVisibilityChanges: Subject<any> = new Subject();
  layerLoads: Subject<any> = new Subject();
  layerLoadings: Subject<{
    layer: Layer<Source>;
    progress: HsLayerLoadProgress;
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
   * DEPRECATED. Moved into the HsDimensionTimeService for mostly internal usage.
   * @deprecated Replaced by layerDimensionDefinitionChanges
   */
  layerTimeChanges: Subject<{
    layer: HsLayerDescriptor;
    time: string;
  }> = new Subject();
  /**
   * Used to listen for changes either in "time" property in HsLayerDescrtiptor
   * or in "dimensions" property in OL Layer object
   */
  layerDimensionDefinitionChanges: Subject<{
    layer: Layer<Source>;
  }> = new Subject();
  /**
   * Used to listen for changes of dimension settings in layermanager-dimensions component
   */
  layermanagerDimensionChanges: Subject<{
    layer: Layer<Source>;
    dimension: HsDimensionDescriptor;
  }> = new Subject();
  vectorQueryFeatureSelection: Subject<{
    feature: Feature<Geometry>;
    selector: Select;
  }> = new Subject();
  vectorQueryFeatureDeselection: Subject<{
    feature: Feature<Geometry>;
    selector: Select;
  }> = new Subject();
  /**
   * Fires when current mainpanel change - toggle, change of opened panel.
   * replaces 'core.mainpanel_changed'
   * @event mainPanelChanges
   */
  mainPanelChanges: Subject<string | void> = new Subject();
  /**
   * replaces 'measure.drawStart'
   */
  measurementStarts: Subject<void> = new Subject();
  /**
   * replaces 'measure.drawEnd'
   */
  measurementEnds: Subject<void> = new Subject();
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
  currentComposition: BehaviorSubject<any> = new BehaviorSubject(null);
  /**
   * replaces 'search.resultsReceived'
   */
  searchResultsReceived: Subject<any> = new Subject();
  searchZoomTo: Subject<any> = new Subject();
  clearSearchResults: Subject<void> = new Subject();
  /**
   * replaces 'query.dataUpdated'
   */
  queryDataUpdated: Subject<any> = new Subject();
  /**
   * replaces 'mapClicked'
   */
  mapClicked: Subject<any> = new Subject();
  /**
   * Fires when layerSelected parameter is found in the URL
   * @event layerSelectedFromUrl
   */
  layerSelectedFromUrl: BehaviorSubject<Layer<Source>> = new BehaviorSubject(
    null
  );
  constructor() {}
}
