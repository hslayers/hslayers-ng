import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import {Injectable, NgZone} from '@angular/core';

import {CollectionEvent} from 'ol/Collection';
import {
  Group,
  Image as ImageLayer,
  Layer,
  Tile,
  Vector as VectorLayer,
} from 'ol/layer';
import {Map} from 'ol';
import {Source} from 'ol/source';
import {unByKey} from 'ol/Observable';

import {EventsKey} from 'ol/events';
import {HS_PRMS} from 'hslayers-ng/components/share';
import {HsAddDataOwsService} from 'hslayers-ng/shared/add-data';
import {HsBaseLayerDescriptor} from 'hslayers-ng/types';
import {HsConfig} from 'hslayers-ng/config';
import {HsDimensionTimeService} from 'hslayers-ng/shared/get-capabilities';
import {HsDrawService} from 'hslayers-ng/shared/draw';
import {HsEventBusService} from 'hslayers-ng/shared/event-bus';
import {HsLanguageService} from 'hslayers-ng/shared/language';
import {HsLayerDescriptor, HsLayerLoadProgress} from 'hslayers-ng/types';
import {HsLayerEditorVectorLayerService} from './layer-editor-vector-layer.service';
import {HsLayerManagerMetadataService} from './layer-manager-metadata.service';
import {HsLayerManagerUtilsService} from './layer-manager-utils.service';
import {HsLayerManagerVisiblityService} from './layer-manager-visiblity.service';
import {HsLayerSelectorService} from './layer-selector.service';
import {HsLayerUtilsService} from 'hslayers-ng/shared/utils';
import {HsLayoutService} from 'hslayers-ng/shared/layout';
import {HsLogService} from 'hslayers-ng/shared/log';
import {HsMapService} from 'hslayers-ng/shared/map';
import {HsQueuesService} from 'hslayers-ng/shared/queues';
import {HsShareUrlService} from 'hslayers-ng/components/share';
import {HsToastService} from 'hslayers-ng/common/toast';
import {HsUtilsService} from 'hslayers-ng/shared/utils';
import {
  SHOW_IN_LAYER_MANAGER,
  getAbstract,
  getBase,
  getCachedCapabilities,
  getCluster,
  getFromBaseComposition,
  getFromComposition,
  getGreyscale,
  getLegends,
  getName,
  getPath,
  getQueryCapabilities,
  getRemovable,
  getShowInLayerManager,
  getSubLayers,
  getThumbnail,
  getTitle,
  setActive,
  setGreyscale,
  setName,
  setOrigLayers,
  setPath,
} from 'hslayers-ng/common/extensions';

export class HsLayermanagerDataObject {
  folders: any;
  layers: HsLayerDescriptor[];
  baselayers: HsBaseLayerDescriptor[];
  terrainlayers: any[];
  baselayer?: string;
  box_layers?: Group[];
  filter: string;
  constructor() {
    /**
     * Folders object for structure of layers. Each level contain 5 properties:
     * hsl_path \{String\}: Worded path to folder position in folders hierarchy.
     * coded_path \{String\}: Path encoded in numbers
     * layers \{Array\}: List of layers for current folder
     * sub_folders \{Array\}: List of subfolders for current folder
     * indent \{Number\}: Hierarchy level for current folder
     * name \{String\}: Optional - only from indent 1, base folder is not named
     * @public
     */
    this.folders = {
      //TODO: need to describe how hsl_path works here
      hsl_path: '',
      coded_path: '0-',
      layers: [],
      sub_folders: [],
      indent: 0,
    };
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
    this.terrainlayers = [];
    this.filter = '';
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
  lastProgressUpdate: number;
  layerEditorElement: any;

  mapEventHandlers: EventsKey[];
  /**
   * Property for pointer to main map object
   */

  constructor(
    public hsConfig: HsConfig,
    public hsDimensionTimeService: HsDimensionTimeService,
    public hsDrawService: HsDrawService,
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
    private zone: NgZone,
    private hsLayerManagerUtilsService: HsLayerManagerUtilsService,
    private hsLayerManagerVisiblityService: HsLayerManagerVisiblityService,
  ) {
    //Keeps 'data' object intact and in one place while allowing to split method between more services
    this.hsLayerManagerVisiblityService.data = this.data;
    this.hsEventBusService.layerManagerUpdates.subscribe((layer) => {
      this.refreshLists();
    });
    this.hsEventBusService.layerDimensionDefinitionChanges.subscribe(
      (olLayer) => {
        if (this.hsDimensionTimeService.layerIsWmsT(olLayer)) {
          const layerDescriptor = this.data.layers.find(
            (ld) => ld.layer == olLayer,
          );
          if (layerDescriptor) {
            this.hsDimensionTimeService.setupTimeLayer(layerDescriptor);
          }
        }
      },
    );

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

      this.sortFoldersByZ();
      this.sortLayersByZ(this.data.layers);
      this.hsEventBusService.layerManagerUpdates.next(null);
      this.toggleEditLayerByUrlParam();
      this.boxLayersInit();

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
  private setupMapEventHandlers(map: Map) {
    const onLayerAddition = map.getLayers().on('add', (e) => {
      this.applyZIndex(e.element as Layer<Source>, true);
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
   * @private
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
      this.hsLayerManagerVisiblityService.layerVisibilityChanged(e),
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
        !this.hsLayerManagerVisiblityService.isLayerInResolutionInterval(layer),
      visible: layer.getVisible(),
      showInLayerManager,
      uid: this.hsUtilsService.generateUuid(),
      idString() {
        return 'layer' + (this.coded_path || '') + (this.uid || '');
      },
      type: await this.hsLayerManagerUtilsService.getLayerSourceType(layer),
      source: this.hsLayerManagerUtilsService.getLayerSourceUrl(layer),
    };
    this.loadingEvents(layerDescriptor);
    layerDescriptor.trackBy = `${layerDescriptor.uid} ${layerDescriptor.position}`;

    layer.on('propertychange', (event) => {
      if (event.key == 'title') {
        layerDescriptor.title = this.hsLayerUtilsService.getLayerTitle(layer);
      }
      if (event.key == SHOW_IN_LAYER_MANAGER) {
        layerDescriptor.showInLayerManager =
          getShowInLayerManager(layer) ?? true;
        if (layerDescriptor.showInLayerManager) {
          this.populateFolders(layer);
        }
      }
    });

    if (getBase(layer) !== true) {
      if (showInLayerManager) {
        this.populateFolders(layer);
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
              !this.hsLayerManagerVisiblityService.isLayerInResolutionInterval(
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
        this.hsLayerManagerVisiblityService.changeBaseLayerVisibility(
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

    this.sortFoldersByZ();
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
   * Executed when a content of data.baselayers or data.terrainlayers changes.
   * Angular does not detect changes inside arrays unless triggered from the view.
   * But it does detect changes of class properties.
   * Hence the whole array is copied so an "immutable" change happens and Angular detects that.
   */
  refreshLists(): void {
    this.data.baselayers = Array.from(this.data.baselayers);
    this.data.terrainlayers = Array.from(this.data.terrainlayers);
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
    const tmp = (this.data[layers] as Array<any>).filter(
      (l) => l.layer == layer,
    );
    if (tmp.length > 0) {
      return tmp[0];
    }
    return;
  }

  /**
   * Place layer into layer manager folder structure based on path property hsl-path of layer
   * @param lyr - Layer to add into folder structure
   */
  populateFolders(lyr: Layer<Source>): void {
    let path = getPath(lyr);
    if (
      !path ||
      path == 'Other' ||
      this.hsLanguageService
        .getTranslation('LAYERMANAGER')
        ['other']?.toLowerCase() === path.toLowerCase()
    ) {
      path = 'other';
      setPath(lyr, path);
    }
    const parts = path.split('/');
    let curfolder = this.data.folders;
    const zIndex = lyr.getZIndex();
    for (let i = 0; i < parts.length; i++) {
      let found = null;
      for (const folder of curfolder.sub_folders) {
        if (folder.name == parts[i]) {
          found = folder;
        }
      }
      if (found === null) {
        //TODO: Need to describe how hsl_path works here
        const new_folder = {
          sub_folders: [],
          indent: i,
          layers: [],
          name: parts[i],
          hsl_path:
            curfolder.hsl_path +
            (curfolder.hsl_path != '' ? '/' : '') +
            parts[i],
          coded_path: curfolder.coded_path + curfolder.sub_folders.length + '-',
          visible: true,
          zIndex: zIndex,
        };
        curfolder.sub_folders.push(new_folder);
        curfolder = new_folder;
      } else {
        curfolder = found;
      }
    }
    curfolder.zIndex = curfolder.zIndex < zIndex ? zIndex : curfolder.zIndex;
    curfolder.layers.push(lyr);
    // if (this.data.folders.layers.indexOf(lyr) > -1) {
    //   this.data.folders.layers.splice(this.data.folders.layers.indexOf(lyr), 1);
    // }
  }

  /**
   * Remove layer from layer folder structure a clean empty folder
   * @private
   * @param lyr - Layer to remove from layer folder
   */
  cleanFolders(lyr: Layer<Source>): void {
    if (getShowInLayerManager(lyr) == false) {
      return;
    }
    if (getPath(lyr) != undefined && getPath(lyr) !== 'undefined') {
      const path = getPath(lyr);
      const parts = path.split('/');
      let curfolder = this.data.folders;
      for (let i = 0; i < parts.length; i++) {
        for (const folder of curfolder.sub_folders) {
          if (folder.name == parts[i]) {
            curfolder = folder;
          }
        }
      }
      curfolder.layers.splice(curfolder.layers.indexOf(lyr), 1);
      for (let i = parts.length; i > 0; i--) {
        if (curfolder.layers.length == 0 && curfolder.sub_folders.length == 0) {
          let newfolder = this.data.folders;
          if (i > 1) {
            for (let j = 0; j < i - 1; j++) {
              for (const folder of newfolder.sub_folders) {
                if (folder.name == parts[j]) {
                  newfolder = folder;
                }
              }
            }
          }
          const ixToRemove = newfolder.sub_folders.indexOf(curfolder);
          if (ixToRemove > -1) {
            newfolder.sub_folders.splice(ixToRemove, 1);
          }
          curfolder = newfolder;
        } else {
          break;
        }
      }
    } else {
      const ixToRemove = this.data.folders.layers.indexOf(lyr);
      if (ixToRemove > -1) {
        this.data.folders.layers.splice(ixToRemove, 1);
      }
    }
  }

  /**
   * Callback function for removing layer. Clean layers variables
   * (PRIVATE)
   * @private
   * @param e - Events emitted by ol.Collection instances are instances of this type.
   */
  layerRemoved(e: CollectionEvent<Layer>): void {
    this.cleanFolders(e.element);
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
    if (getShowInLayerManager(e.element) !== false) {
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
   * Initialize box layers and their starting active state
   * (PRIVATE)
   * @private
   */
  private boxLayersInit(): void {
    if (this.hsConfig.box_layers != undefined) {
      this.data.box_layers = this.hsConfig.box_layers;
      for (const box of this.data.box_layers) {
        let visible = false;
        let baseVisible = false;
        for (const layer of box.get('layers').getArray()) {
          if (layer.get('visible') == true && getBase(layer) == true) {
            baseVisible = true;
          } else if (layer.get('visible') == true) {
            visible = true;
          }
        }
        (box as any).thumbnail = getThumbnail(box);
        setActive(box, baseVisible ? baseVisible : visible);
      }
    }
  }

  /**
   * Remove all non-base layers that were added to the map by user.
   * Doesn't remove layers added through app config (In case we want it to be 'removable', it can be set to true in the config.)
   * (PRIVATE)
   * @private
   */
  removeAllLayers(): void {
    const to_be_removed = [];
    this.hsMapService
      .getMap()
      .getLayers()
      .forEach((lyr: Layer<Source>) => {
        if (getRemovable(lyr) == true) {
          if (getBase(lyr) == undefined || getBase(lyr) == false) {
            if (
              getShowInLayerManager(lyr) == undefined ||
              getShowInLayerManager(lyr) == true
            ) {
              to_be_removed.push(lyr);
            }
          }
        }
      });
    while (to_be_removed.length > 0) {
      this.hsMapService.getMap().removeLayer(to_be_removed.shift());
    }
    this.hsDrawService.addedLayersRemoved = true;
    this.hsDrawService.fillDrawableLayers();
  }

  /**
   * Create events for checking if layer is being loaded or is loaded for ol.layer.Image or ol.layer.Tile
   * @param layer - Layer which is being added
   */
  loadingEvents(layer: HsLayerDescriptor): void {
    const olLayer = layer.layer;
    const source: any = olLayer.getSource();
    if (!source) {
      this.hsLog.error(`Layer ${getTitle(olLayer)} has no source`);
      return;
    }
    const loadProgress = {
      loadCounter: 0,
      loadTotal: 0,
      loadError: 0,
      loaded: true,
      error: undefined,
      percents: 0,
    };
    layer.loadProgress = loadProgress;
    if (this.hsUtilsService.instOf(olLayer, VectorLayer)) {
      source.on('propertychange', (event) => {
        if (event.key == 'loaded') {
          if (event.oldValue == false) {
            this.hsEventBusService.layerLoads.next(olLayer);
          } else {
            this.hsEventBusService.layerLoadings.next({
              layer: olLayer,
              progress: loadProgress,
            });
          }
        }
      });
      source.on('featuresloaderror', (evt) => {
        if (layer.loadProgress) {
          layer.loadProgress.error = true;
        }
        this.hsToastService.createToastPopupMessage(
          'LAYERS.featuresLoadError',
          `${
            layer.title
          }: ${this.hsLanguageService.getTranslationIgnoreNonExisting(
            'ADDLAYERS.ERROR',
            'someErrorHappened',
            null,
          )}`,
          {},
        );
      });
    } else if (this.hsUtilsService.instOf(olLayer, ImageLayer)) {
      source.on('imageloadstart', (event) => {
        loadProgress.loadTotal += 1;
        this.changeLoadCounter(olLayer, loadProgress, 1);
      });
      source.on('imageloadend', (event) => {
        loadProgress.error = false;
        this.changeLoadCounter(olLayer, loadProgress, -1);
      });
      source.on('imageloaderror', (event) => {
        loadProgress.loaded = true;
        loadProgress.error = true;
        this.hsEventBusService.layerLoads.next(olLayer);
      });
    } else if (this.hsUtilsService.instOf(olLayer, Tile)) {
      source.on('tileloadstart', (event) => {
        loadProgress.loadTotal += 1;
        this.changeLoadCounter(olLayer, loadProgress, 1);
      });
      source.on('tileloadend', (event) => {
        loadProgress.error = false;
        this.changeLoadCounter(olLayer, loadProgress, -1);
      });
      source.on('tileloaderror', (event) => {
        this.changeLoadCounter(olLayer, loadProgress, -1);
        loadProgress.loadError += 1;
        if (loadProgress.loadError == loadProgress.loadTotal) {
          loadProgress.error = true;
        }
      });
    }
  }

  private changeLoadCounter(
    layer: Layer<Source>,
    progress: HsLayerLoadProgress,
    change: number,
  ): void {
    progress.loadCounter += change;
    //No more tiles to load?
    if (progress.loadCounter == 0) {
      progress.loaded = true;
      // If in 2 seconds no new tiles are starting to to load
      // we can assume that layer has finished loading
      if (progress.timer) {
        clearTimeout(progress.timer);
      }
      progress.timer = setTimeout(() => {
        if (progress.loadCounter == 0) {
          this.zone.run(() => {
            progress.loadTotal = 0;
            this.hsEventBusService.layerLoads.next(layer);
            progress.percents = 100;
          });
        }
      }, 2000);
    } else {
      progress.loaded = progress.loadTotal > 0 ? false : true;
    }

    let percents = 100.0;
    if (progress.loadTotal > 0) {
      percents = Math.round(
        ((progress.loadTotal - progress.loadCounter) / progress.loadTotal) *
          100,
      );
    }
    progress.percents = percents;
    this.hsEventBusService.layerLoadings.next({layer, progress});
    //Throttle updating UI a bit for many layers * many tiles
    const delta = new Date().getTime() - this.lastProgressUpdate;
    if (percents == 100 || delta > 1000) {
      this.zone.run(() => {
        this.lastProgressUpdate = new Date().getTime();
      });
    }
  }

  /**
   * Toggles Additional information panel for current layer.
   * @param layer - Selected layer (HsLayerManagerService.currentLayer)
   * @param toToggle - Part of layer editor to be toggled
   * @param control - Part of layer editor to be controlled for state.
   * Determines whether only toggled part or whole layereditor would be closed
   */
  toggleLayerEditor(
    layer: HsLayerDescriptor,
    toToggle: string,
    control: string,
  ): void {
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
      if (this.hsUtilsService.runningInBrowser()) {
        const layerNode = document.getElementById(layer.idString());
        if (layerNode && this.layerEditorElement) {
          this.hsUtilsService.insertAfter(this.layerEditorElement, layerNode);
        }
      }
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

  sortFoldersByZ(): void {
    this.data.folders.sub_folders.sort(
      (a, b) =>
        (a.zIndex < b.zIndex ? -1 : a.zIndex > b.zIndex ? 1 : 0) *
        (this.hsConfig.reverseLayerList ?? true ? -1 : 1),
    );
  }

  resolutionChangeDebounceCallback(): void {
    setTimeout(() => {
      for (let i = 0; i < this.data.layers.length; i++) {
        const tmp =
          !this.hsLayerManagerVisiblityService.isLayerInResolutionInterval(
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
          this.toggleLayerEditor(layerFound, 'settings', 'sublayers');
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
