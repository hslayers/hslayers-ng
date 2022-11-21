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
  mapResets: Subject<{app}> = new Subject();
  layerManagerUpdates: Subject<{layer: Layer<Source> | void; app: string}> =
    new Subject();
  compositionLoadStarts: Subject<any> = new Subject();
  compositionDeletes: Subject<{composition; app: string}> = new Subject();
  /**
   * Fires when composition is loaded or not loaded with Error message
   * @event compositionLoads
   */
  compositionLoads: Subject<{data: any; app: string}> = new Subject();
  layerRemovals: Subject<Layer<Source>> = new Subject();
  compositionEdits: Subject<{app: string}> = new Subject();
  layerAdditions: Subject<any> = new Subject();
  LayerManagerBaseLayerVisibilityChanges: Subject<any> = new Subject();
  LayerManagerLayerVisibilityChanges: Subject<any> = new Subject();
  layerLoads: Subject<{layer: Layer<Source>; app: string}> = new Subject();
  layerLoadings: Subject<{
    layer: Layer<Source>;
    progress: HsLayerLoadProgress;
    app: string;
  }> = new Subject();
  /**
   * Fires when user enables layer time synchronization in the UI
   * Used to synchronize time in PARAMS across WM(T)S-t layers
   */
  layerTimeSynchronizations: Subject<{
    sync: boolean;
    time?: string;
    app: string;
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
    app: string;
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
    app: string;
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
  mainPanelChanges: Subject<{which?: string; app: string}> = new Subject();
  /**
   * replaces 'measure.drawStart'
   */
  measurementStarts: Subject<{app: string}> = new Subject();
  /**
   * replaces 'measure.drawEnd'
   */
  measurementEnds: Subject<{app: string}> = new Subject();
  cesiumLoads: Subject<any> = new Subject();
  cesiumResizes: Subject<any> = new Subject();
  zoomTo: Subject<any> = new Subject();
  /**
   * Fires when map extent change (move, zoom, resize).
   * Returns structure containing OL map, event which triggered the extent change, newly
   * calculated {@link http://openlayers.org/en/latest/apidoc/ol.html#.Extent extent}
   * and app name ('default' in most cases)
   */
  mapExtentChanges: Subject<{
    map: Map;
    event: string;
    extent: number[];
    app: string;
  }> = new Subject();
  mapCenterSynchronizations: Subject<any> = new Subject();
  mapLibraryChanges: Subject<any> = new Subject();
  /**
   * replaces 'cesium.time_layers_changed'
   */
  cesiumTimeLayerChanges: Subject<any> = new Subject();
  layoutResizes: Subject<any> = new Subject();
  layoutLoads: Subject<{element: any; innerElement: string; app: string}> =
    new Subject();
  /**
   * replaces 'map.loaded'
   */
  olMapLoads: Subject<{map: Map; app: string}> = new Subject();
  /**
   * Fires when composition is downloaded from server and parsing begins
   * replaces 'compositions.composition_loading'
   * @event compositionLoading
   * @deprecated
   */
  compositionLoading: Subject<any> = new Subject();
  currentComposition: BehaviorSubject<any> = new BehaviorSubject(null);
  /**
   * replaces 'search.resultsReceived'
   */
  searchResultsReceived: Subject<{app}> = new Subject();
  searchZoomTo: Subject<any> = new Subject();
  clearSearchResults: Subject<{app}> = new Subject();
  /**
   * replaces 'query.dataUpdated'
   */
  queryDataUpdated: Subject<any> = new Subject();
  /**
   * replaces 'mapClicked'
   */
  mapClicked: Subject<{coordinates; app: string}> = new Subject();
  /**
   * Fires when layerSelected parameter is found in the URL
   * @event layerSelectedFromUrl
   */
  layerSelectedFromUrl: BehaviorSubject<Layer<Source>> = new BehaviorSubject(
    null
  );
  constructor() {}
}
