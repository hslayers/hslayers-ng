import {BehaviorSubject, Subject} from 'rxjs';
import {Injectable} from '@angular/core';

import {Feature, Map} from 'ol';
import {Geometry} from 'ol/geom';
import {Layer} from 'ol/layer';
import {Select} from 'ol/interaction';
import {Source} from 'ol/source';

import {HsDimensionDescriptor} from '../get-capabilities/dimension';
import {
  HsLayerDescriptor,
  HsLayerLoadProgress,
} from 'hslayers-ng/components/layer-manager/layer-descriptor.interface';
import {
  HsMapCompositionDescriptor,
  LaymanCompositionDescriptor,
} from 'hslayers-ng/components/compositions/models/composition-descriptor.model';

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
  /**
   * Fires when map completely reset
   */
  mapResets: Subject<void> = new Subject();
  compositionLoadStarts: Subject<string> = new Subject();
  compositionDeletes: Subject<HsMapCompositionDescriptor> = new Subject();
  /**
   * Fires when composition is loaded or not loaded with Error message
   */
  compositionLoads: Subject<any> = new Subject();
  compositionEdits: Subject<void> = new Subject();
  layerRemovals: Subject<Layer<Source>> = new Subject();
  /**
   * Fires when new layer is added to the app.
   * Suppressed for layers defined in default_layers in HsConfig.
   */
  layerAdditions: Subject<HsLayerDescriptor> = new Subject();
  LayerManagerBaseLayerVisibilityChanges: Subject<any> = new Subject();
  LayerManagerLayerVisibilityChanges: Subject<any> = new Subject();
  /**
   * Fires when layer is added or removed in LayerManager or its z-index changes or its title changes via rename.
   */
  layerManagerUpdates: Subject<Layer<Source> | void> = new Subject();
  /**
   * Fires when layer finishes loading its features or tiles.
   * Usually triggered once, when all features are loaded, or after all features/tiles in given view/extent are loaded.
   */
  layerLoads: Subject<Layer<Source>> = new Subject();
  layerLoadings: Subject<{
    layer: Layer<Source>;
    progress: HsLayerLoadProgress;
  }> = new Subject();
  /**
   * Fires when user enables layer time synchronization in the UI.
   * Used to synchronize time in PARAMS across WM(T)S-t layers.
   */
  layerTimeSynchronizations: Subject<{
    sync: boolean;
    time?: string;
  }> = new Subject();
  /**
   * Used to listen for changes either in "time" property in HsLayerDescriptor
   * or in "dimensions" property in OL Layer object
   */
  layerDimensionDefinitionChanges: Subject<Layer<Source>> = new Subject();
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
   */
  mainPanelChanges: Subject<string | null> = new Subject();
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
   * Returns structure containing OL map, event which triggered the extent change, newly
   * calculated {@link http://openlayers.org/en/latest/apidoc/ol.html#.Extent extent}
   * and app name ('default' in most cases)
   */
  mapExtentChanges: Subject<{
    map: Map;
    event: string;
    extent: number[];
  }> = new Subject();
  mapCenterSynchronizations: Subject<any> = new Subject();
  mapLibraryChanges: Subject<any> = new Subject();
  /**
   * replaces 'cesium.time_layers_changed'
   */
  cesiumTimeLayerChanges: Subject<any> = new Subject();
  layoutResizes: Subject<void> = new Subject();
  layoutLoads: Subject<{element: any; innerElement: string}> = new Subject();
  /**
   * replaces 'map.loaded'
   */
  olMapLoads: Subject<Map> = new Subject();
  /**
   * replaces 'search.resultsReceived'
   */
  searchResultsReceived: Subject<void> = new Subject();
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
   */
  layerSelectedFromUrl: BehaviorSubject<Layer<Source>> = new BehaviorSubject(
    null,
  );
  updateMapSize: Subject<void> = new Subject();
  constructor() {}
}
