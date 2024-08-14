import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import {Injectable, Signal} from '@angular/core';
import {
  Observable,
  filter as rxjsFilter,
  scan,
  share,
  switchMap,
  take,
} from 'rxjs';
import {toSignal} from '@angular/core/rxjs-interop';

import {CollectionEvent} from 'ol/Collection';
import {EventsKey} from 'ol/events';
import {Layer} from 'ol/layer';
import {Map as OlMap} from 'ol';
import {Source} from 'ol/source';
import {unByKey} from 'ol/Observable';

import {HS_PRMS} from 'hslayers-ng/services/share';
import {HsAddDataOwsService} from 'hslayers-ng/services/add-data';
import {HsBaseLayerDescriptor} from 'hslayers-ng/types';
import {HsConfig} from 'hslayers-ng/config';
import {HsDimensionTimeService} from 'hslayers-ng/services/get-capabilities';
import {HsEventBusService} from 'hslayers-ng/services/event-bus';
import {HsLanguageService} from 'hslayers-ng/services/language';
import {HsLayerDescriptor} from 'hslayers-ng/types';
import {HsLayerSelectorService} from './layer-selector.service';
import {HsLayerUtilsService} from 'hslayers-ng/services/utils';
import {HsLayermanagerFolder} from 'hslayers-ng/types';
import {HsLayoutService} from 'hslayers-ng/services/layout';
import {HsLogService} from 'hslayers-ng/services/log';
import {HsMapService} from 'hslayers-ng/services/map';
import {HsQueuesService} from 'hslayers-ng/services/queues';
import {HsShareUrlService} from 'hslayers-ng/services/share';
import {HsTerrainLayerDescriptor} from 'hslayers-ng/types';
import {HsToastService} from 'hslayers-ng/common/toast';
import {HsUtilsService} from 'hslayers-ng/services/utils';
import {
  SHOW_IN_LAYER_MANAGER,
  getAbstract,
  getBase,
  getCachedCapabilities,
  getCluster,
  getFromBaseComposition,
  getFromComposition,
  getGreyscale,
  getIgnorePathZIndex,
  getLegends,
  getName,
  getPath,
  getQueryCapabilities,
  getShowInLayerManager,
  getSubLayers,
  getTitle,
  setGreyscale,
  setName,
  setOrigLayers,
} from 'hslayers-ng/common/extensions';

import {HsLayerEditorVectorLayerService} from './layer-editor-vector-layer.service';
import {HsLayerManagerFolderService} from './layer-manager-folder.service';
import {HsLayerManagerLoadingProgressService} from './layer-manager-loading-progress.service';
import {HsLayerManagerMetadataService} from './layer-manager-metadata.service';
import {HsLayerManagerUtilsService} from './layer-manager-utils.service';
import {HsLayerManagerVisibilityService} from './layer-manager-visibility.service';

export class HsLayermanagerDataObject {
  // Folders object for structure of layers.
  folders: Signal<Map<string, HsLayermanagerFolder>>;
  layers: HsLayerDescriptor[];
  baselayers: HsBaseLayerDescriptor[];
  terrainLayers: HsTerrainLayerDescriptor[];
  baselayer?: string;
  /**
   * Defined from component to allow reactivity
   */
  filter: Observable<string>;
  constructor() {
    /**
     * List of all layers (baselayers are excluded) loaded in LayerManager.
     * @public
     */
    this.layers = [];
    /**
     * List of all baselayers loaded in layer manager.
     * @public
     */
    this.baselayers = [];
    /*
     * List of all cesium terrain layers loaded in layer manager.
     * @public
     */
    this.terrainLayers = [];
  }
}

@Injectable({
  providedIn: 'root',
})
export class HsLayerManagerService {
  data = new HsLayermanagerDataObject();
  timer: any;
  menuExpanded = false;
  zIndexValue = 0;
  layerEditorElement: any;

  mapEventHandlers: EventsKey[];
  constructor(
    public hsConfig: HsConfig,
    public hsDimensionTimeService: HsDimensionTimeService,
    public hsEventBusService: HsEventBusService,
    public hsLanguageService: HsLanguageService,
    public hsLayerEditorVectorLayerService: HsLayerEditorVectorLayerService,
    public hsLayerManagerMetadata: HsLayerManagerMetadataService,
    public hsLayerSelectorService: HsLayerSelectorService,
    public hsLayerUtilsService: HsLayerUtilsService,
    public hsLayoutService: HsLayoutService,
    public hsLog: HsLogService,
    public hsMapService: HsMapService,
    public hsQueuesService: HsQueuesService,
    public hsAddDataOwsService: HsAddDataOwsService,
    private hsShareUrlService: HsShareUrlService,
    public hsToastService: HsToastService,
    public hsUtilsService: HsUtilsService,
    public sanitizer: DomSanitizer,
    private hsLayerManagerUtilsService: HsLayerManagerUtilsService,
    private hsLayerManagerVisibilityService: HsLayerManagerVisibilityService,
    private folderService: HsLayerManagerFolderService,
    private hsLoadingProgressService: HsLayerManagerLoadingProgressService,
  ) {
    //Keeps 'data' object intact and in one place while allowing to split method between more services
    this.hsLayerManagerVisibilityService.data = this.data;
    this.folderService.data = this.data;

    // Handle the state accumulation via the reducer
    this.data.folders = toSignal(
      this.folderService.folderAction$.pipe(
        scan(
          (acc, value) => this.folderService.foldersReducer(acc, value),
          new Map<string, HsLayermanagerFolder>(),
        ),
        share(),
      ),
    );

    this.hsEventBusService.layerManagerUpdates.subscribe((layer) => {
      this.refreshLists();
    });

    /**
     * Setup time layer
     */
    //Give enough time for layerDescriptor to be set up by waiting for
    // mapEventHandlersSet to emit first
    this.hsEventBusService.mapEventHandlersSet
      .pipe(
        take(1),
        //Switch to layerDimensionDefinitionChanges
        switchMap((_) => {
          return this.hsEventBusService.layerDimensionDefinitionChanges.pipe(
            //Continue only for WmsT layers
            rxjsFilter((layer) =>
              this.hsDimensionTimeService.layerIsWmsT(layer),
            ),
          );
        }),
      )
      .subscribe((olLayer) => {
        const layerDescriptor = this.data.layers.find(
          (ld) => ld.layer == olLayer,
        );
        if (layerDescriptor) {
          this.hsDimensionTimeService.setupTimeLayer(layerDescriptor);
        }
      });

    this.hsMapService.loaded().then(async (map) => {
      for (const lyr of map.getLayers().getArray()) {
        this.applyZIndex(lyr as Layer<Source>);
        await this.layerAdded(
          {
            element: lyr as Layer<Source>,
          },
          true,
        );
      }

      this.folderService.folderAction$.next(this.folderService.sortByZ());
      this.sortLayersByZ(this.data.layers);
      this.hsEventBusService.layerManagerUpdates.next(null);
      this.toggleEditLayerByUrlParam();

      this.setupMapEventHandlers(map);
    });
  }

  /**
   * UnBind event listeners
   */
  destroy(): void {
    for (const handler of this.mapEventHandlers) {
      unByKey(handler);
    }
  }

  /**
   * Setup map-event handlers and store their keys in an array
   */
  private setupMapEventHandlers(map: OlMap) {
    const onLayerAddition = map.getLayers().on('add', (e) => {
      this.applyZIndex(
        e.element as Layer<Source>,
        //z-index of composition layers should be the same as order of layers in composition.
        //ignoring folder structure
        !getIgnorePathZIndex(e.element as Layer<Source>),
      );
      if (getShowInLayerManager(e.element) == false) {
        return;
      }
      this.layerAdded(e as any, getFromBaseComposition(e.element));
    });
    const onLayerRemove = map
      .getLayers()
      .on('remove', (e) => this.layerRemoved(e as any));

    const onResolutionChange = map.getView().on(
      'change:resolution',
      this.hsUtilsService.debounce(
        (e) => this.resolutionChangeDebounceCallback(),
        200,
        false,
        this,
      ),
    );
    this.mapEventHandlers = [
      onLayerAddition,
      onLayerRemove,
      onResolutionChange,
    ];
    this.hsEventBusService.mapEventHandlersSet.next();
  }

  /**
   * Function for adding layer added to map into layer manager structure.
   * In service automatically used after layer is added to map.
   * Layers which shouldn't be in layer manager (showInLayerManager property) aren't added.
   * Loading events and legends URLs are created for each layer.
   * Layers also get automatic watcher for changing visibility (to synchronize visibility in map and layer manager).
   * Position is calculated for each layer and for time layers time properties are created.
   * Each layer is also inserted in correct layer list and inserted into folder structure.
   * @param e - Event object emitted by OL add layer event
   * @param suspendEvents - If set to true, no new values for layerAdditions, layerManagerUpdates or compositionEdits observables will be emitted.
   */
  async layerAdded(
    e: {element: Layer<Source>},
    suspendEvents?: boolean,
  ): Promise<void> {
    const layer = e.element;
    this.hsLayerManagerUtilsService.checkLayerHealth(layer);
    const showInLayerManager = getShowInLayerManager(layer) ?? true;
    layer.on('change:visible', (e) =>
      this.hsLayerManagerVisibilityService.layerVisibilityChanged(e),
    );
    if (
      this.hsLayerUtilsService.isLayerVectorLayer(layer) &&
      getCluster(layer)
    ) {
      this.hsLayerEditorVectorLayerService.layersClusteredFromStart.push(layer);
      await this.hsLayerEditorVectorLayerService.cluster(
        true,
        layer,
        this.hsConfig.clusteringDistance || 40,
        false,
      );
    }
    /**
     * Wrapper for layers in layer manager structure.
     * Each layer object stores layer's title, grayed (if layer is currently visible - for layers which have max/min resolution), visible (layer is visible), and actual layer.
     * Each layer wrapper is accessible from layer list or folder structure.
     * @private
     */
    const layerDescriptor: HsLayerDescriptor = {
      title: this.hsLayerUtilsService.getLayerTitle(layer),
      abstract: getAbstract(layer),
      layer,
      grayed:
        !this.hsLayerManagerVisibilityService.isLayerInResolutionInterval(
          layer,
        ),
      visible: layer.getVisible(),
      showInLayerManager,
      uid: this.hsUtilsService.generateUuid(),
      idString() {
        return 'layer' + (this.coded_path || '') + (this.uid || '');
      },
      type: await this.hsLayerManagerUtilsService.getLayerSourceType(layer),
      source: this.hsLayerManagerUtilsService.getLayerSourceUrl(layer),
    };
    this.hsLoadingProgressService.loadingEvents(layerDescriptor);
    layerDescriptor.trackBy = `${layerDescriptor.uid} ${layerDescriptor.position}`;

    layer.on('propertychange', (event) => {
      if (event.key == 'title') {
        layerDescriptor.title = this.hsLayerUtilsService.getLayerTitle(layer);
      }
      if (event.key == SHOW_IN_LAYER_MANAGER) {
        layerDescriptor.showInLayerManager =
          getShowInLayerManager(layer) ?? true;
        if (layerDescriptor.showInLayerManager) {
          this.folderService.folderAction$.next(
            this.folderService.addLayer(layerDescriptor),
          );
        }
      }
    });

    if (getBase(layer) !== true) {
      if (showInLayerManager) {
        this.folderService.folderAction$.next(
          this.folderService.addLayer(layerDescriptor),
        );
      }
      layerDescriptor.legends = getLegends(layer);
      this.data.layers.push(layerDescriptor);
      if (getSubLayers(layer)) {
        /*Need to keep track of original LAYERS value for saving to composition*/
        const params = this.hsLayerUtilsService.getLayerParams(layer);
        if (params?.LAYERS) {
          setOrigLayers(layer, params.LAYERS);
        }
      }
      if (getQueryCapabilities(layer) !== false) {
        const que = this.hsQueuesService.ensureQueue(
          'wmsGetCapabilities',
          1,
          //In case of slow request give 10s for other tasks to complete before
          //making another request that might be blocking otherwise
          10000,
        );
        que.push(async (cb) => {
          try {
            await this.hsLayerManagerMetadata.fillMetadata(layerDescriptor);
            layerDescriptor.grayed =
              !this.hsLayerManagerVisibilityService.isLayerInResolutionInterval(
                layer,
              );
            cb();
          } catch (err) {
            cb(err);
          }
        });
      }
    } else {
      layerDescriptor.active = layer.getVisible();
      if (layerDescriptor.active) {
        this.hsLayerManagerVisibilityService.changeBaseLayerVisibility(
          true,
          layerDescriptor,
        );
      }
      layerDescriptor.thumbnail =
        this.hsLayerManagerUtilsService.getImage(layer);
      this.data.baselayers.push(<HsBaseLayerDescriptor>layerDescriptor);
      //Composition layers are already set up using ol.layer.className
      if (getGreyscale(layer) && !getFromComposition(layer)) {
        setTimeout(() => {
          this.setGreyscale(layerDescriptor);
        }, 100);
      }
    }

    if (!getName(layer)) {
      setName(layer, getTitle(layer));
    }
    //*NOTE Commented out, because the  following references to this.data.baselayer are causing issues.

    // if (layer.getVisible() && getBase(layer)) {
    //   this.data.baselayer = this.HsLayerUtilsService.getLayerTitle(layer);
    // }

    this.folderService.folderAction$.next(this.folderService.sortByZ());
    if (!suspendEvents) {
      this.hsEventBusService.layerAdditions.next(layerDescriptor);
      this.hsEventBusService.layerManagerUpdates.next(layer);
      this.hsEventBusService.compositionEdits.next();
    }
  }

  /**
   * Sort layers which are added to map and registered
   * in layermanager by Z and notify components that layer positions have changed.
   */
  updateLayerListPositions(): void {
    //TODO: We could also sort by title or other property. Not supported right now though, just zIndex
    this.data.layers = this.sortLayersByZ(this.data.layers);
  }

  sortLayersByZ(arr: any[]): any[] {
    const minus = this.hsConfig.reverseLayerList ?? true;
    return arr.sort((a, b) => {
      a = a.layer.getZIndex();
      b = b.layer.getZIndex();
      return (a < b ? -1 : a > b ? 1 : 0) * (minus ? -1 : 1);
    });
  }

  /**
   * Executed when a content of data.baselayers or data.terrainLayers changes.
   * Angular does not detect changes inside arrays unless triggered from the view.
   * But it does detect changes of class properties.
   * Hence the whole array is copied so an "immutable" change happens and Angular detects that.
   */
  refreshLists(): void {
    this.data.baselayers = Array.from(this.data.baselayers);
    this.data.terrainLayers = Array.from(this.data.terrainLayers);
  }

  /**
   * (PRIVATE) Get layer by its title
   * @private
   */
  getLayerByTitle(title: string): HsLayerDescriptor | undefined {
    let tmp;
    for (const layer of this.data.layers) {
      if (layer.title == title) {
        tmp = layer;
      }
    }
    return tmp;
  }

  /**
   * Get layer container object for OL layer
   * @private
   * @param layer - to get layer title
   * @param base - Wether to search within base layers or not. Defaults to false
   * @returns Layer container which is used in layer-list directive
   */
  getLayerDescriptorForOlLayer(
    layer: Layer<Source>,
    base = false,
  ): HsLayerDescriptor {
    const layers = base ? 'baselayers' : 'layers';
    return (this.data[layers] as Array<any>).find((l) => l.layer == layer);
  }

  /**
   * Callback function for removing layer. Clean layers variables
   * @param e - Events emitted by ol.Collection instances are instances of this type.
   */
  layerRemoved(e: CollectionEvent<Layer>): void {
    const showInLayerManager = getShowInLayerManager(e.element);
    /**
     * Layers outside the folder structure eg. base and those not shown in LM
     * should not trigger folder update
     */
    if (showInLayerManager !== false && !getBase(e.element)) {
      this.folderService.folderAction$.next(
        this.folderService.removeLayer(
          this.getLayerDescriptorForOlLayer(e.element),
        ),
      );
    }
    for (let i = 0; i < this.data.layers.length; i++) {
      if (this.data.layers[i].layer == e.element) {
        this.data.layers.splice(i, 1);
      }
    }
    for (let i = 0; i < this.data.baselayers.length; i++) {
      if (this.data.baselayers[i].layer == e.element) {
        this.data.baselayers.splice(i, 1);
      }
    }
    this.removeFromArray(
      this.hsLayerEditorVectorLayerService.layersClusteredFromStart,
      e.element,
    );
    this.hsEventBusService.layerManagerUpdates.next(e.element);
    this.hsEventBusService.layerRemovals.next(e.element);
    if (showInLayerManager !== false) {
      this.hsEventBusService.compositionEdits.next();
    }
    const layers = this.hsMapService.getMap().getLayers().getArray();
    if (this.zIndexValue > layers.length) {
      this.zIndexValue--;
    }
  }

  removeFromArray(arrayToSearch: Layer<Source>[], layer: Layer<Source>) {
    for (let i = 0; i < arrayToSearch.length; i++) {
      if (arrayToSearch[i] == layer) {
        arrayToSearch.splice(i, 1);
      }
    }
  }

  /**
   * Toggles Additional information panel for current layer.
   * @param layer - Selected layer (HsLayerManagerService.currentLayer)
   * @param toToggle - Part of layer editor to be toggled
   */
  toggleLayerEditor(
    layer: HsLayerDescriptor,
    toToggle: 'sublayers' | 'settings',
  ): void {
    //  Part of layer editor to be controlled for state.
    //  Determines whether only toggled part or whole layereditor would be closed
    const control = toToggle === 'settings' ? 'sublayers' : 'settings';
    if (!getCachedCapabilities(layer.layer)) {
      this.hsLayerManagerMetadata.fillMetadata(layer);
    }

    if (toToggle == 'sublayers' && layer.hasSublayers != true) {
      return;
    }
    if (this.hsLayerSelectorService.currentLayer != layer) {
      this.toggleCurrentLayer(layer);
      if (this.menuExpanded) {
        this.menuExpanded = false;
      }
      layer[toToggle] = true;
    } else {
      layer[toToggle] = !layer[toToggle];
      if (!layer[control]) {
        this.toggleCurrentLayer(layer);
      }
    }
  }

  /**
   * Opens detailed panel for manipulating selected layer and viewing metadata
   * @param layer - Selected layer to edit or view - Wrapped layer object
   */
  toggleCurrentLayer(layer: HsLayerDescriptor): void | false {
    if (this.hsLayerSelectorService.currentLayer === layer) {
      layer.sublayers = false;
      layer.settings = false;
      this.hsLayerSelectorService.select(null);
      this.updateGetParam(undefined);
    } else {
      this.setCurrentLayer(layer);
      return false;
    }
  }

  setCurrentLayer(layer: HsLayerDescriptor): boolean {
    try {
      this.updateGetParam(layer.title);
      if (!layer.checkedSubLayers) {
        layer.checkedSubLayers = {};
        layer.withChildren = {};
      }
      this.hsLayerSelectorService.select(layer);
      return false;
    } catch (ex) {
      this.hsLog.error(ex);
    }
  }

  private updateGetParam(title: string) {
    const t = {};
    t[HS_PRMS.layerSelected] = title;
    this.hsShareUrlService.updateCustomParams(t);
  }

  /**
   * Makes layer greyscale
   * @param layer - Selected layer (currentLayer)
   */
  setGreyscale(layer: HsLayerDescriptor): void {
    const layerContainer = this.hsLayoutService.contentWrapper.querySelector(
      '.ol-layers > div:first-child',
    );
    if (layerContainer.classList.contains('hs-greyscale')) {
      layerContainer.classList.remove('hs-greyscale');
      setGreyscale(layer.layer, false);
    } else {
      layerContainer.classList.add('hs-greyscale');
      setGreyscale(layer.layer, true);
    }

    setTimeout(() => {
      //Dispatching change event triggers renderer which causes non base layer to be
      //moved into separate canvas thus not being affected by css filter
      layer.layer.getSource().changed();
      layer.galleryMiniMenu = false;
    }, 0);
  }

  resolutionChangeDebounceCallback(): void {
    setTimeout(() => {
      for (let i = 0; i < this.data.layers.length; i++) {
        const tmp =
          !this.hsLayerManagerVisibilityService.isLayerInResolutionInterval(
            this.data.layers[i].layer,
          );
        if (this.data.layers[i].grayed != tmp) {
          this.data.layers[i].grayed = tmp;
        }
      }
      this.timer = null;
    }, 250);
  }

  /**
   * Opens editor for layer specified in 'hs-layer-selected' url parameter
   */
  private toggleEditLayerByUrlParam() {
    const layerTitle = this.hsShareUrlService.getParamValue(
      HS_PRMS.layerSelected,
    );
    if (layerTitle != undefined) {
      setTimeout(() => {
        const layerFound = this.data.layers.find(
          (layer) => layer.title == layerTitle,
        );
        if (layerFound !== undefined) {
          this.toggleLayerEditor(layerFound, 'settings');
          this.hsEventBusService.layerSelectedFromUrl.next(layerFound.layer);
        }
      }, 500);
    }
  }

  /**
   * Sets zIndex of layer being added to be the highest among layers in same path
   * @param layer - layer being added
   */
  private setPathMaxZIndex(layer: Layer<Source>): void {
    let pathLayers;
    if (getBase(layer)) {
      pathLayers = this.data.baselayers;
    } else {
      let path = getPath(layer);
      //If not set it'll be assigned inside populateFolders function as 'other'
      path = path ?? 'other';

      pathLayers = this.data.layers.filter(
        (layer) => getPath(layer.layer) == path,
      );
    }

    if (pathLayers.length > 0) {
      //Get max available index value
      const maxPathZIndex = Math.max(
        ...pathLayers.map((lyr) => lyr.layer.getZIndex() || 0),
      );

      layer.setZIndex(maxPathZIndex + 1);
      //Increase zIndex of the layer that are supposed to be rendered above inserted
      for (const lyr of this.data.layers.filter(
        (lyr) => lyr.layer.getZIndex() >= layer.getZIndex(),
      )) {
        lyr.layer.setZIndex(lyr.layer.getZIndex() + 1);
      }
    }
  }

  /**
   * Sets zIndex of layer being added.
   * @param layer - layer being added
   * @param asCallback - Whether the function is called directly or as a callback of add layer event.
   * No need to run each layer through setPathMaxZIndex on init
   */
  applyZIndex(layer: Layer<Source>, asCallback?: boolean): void {
    if (asCallback && getShowInLayerManager(layer) !== false) {
      this.setPathMaxZIndex(layer);
    }

    if (layer.getZIndex() == undefined) {
      layer.setZIndex(this.zIndexValue++);
    } else {
      this.zIndexValue++;
    }
  }

  makeSafeAndTranslate(group: string, input: string): SafeHtml {
    const translation = this.hsLanguageService.getTranslationIgnoreNonExisting(
      group,
      input,
      undefined,
    );
    if (translation) {
      return this.sanitizer.bypassSecurityTrustHtml(translation);
    } else {
      return '';
    }
  }
}
