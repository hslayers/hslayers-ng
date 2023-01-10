import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import {Injectable, NgZone} from '@angular/core';

import {Cluster, ImageWMS, Source, TileArcGISRest, TileWMS} from 'ol/source';
import {CollectionEvent} from 'ol/Collection';
import {GeoJSON} from 'ol/format';
import {Geometry} from 'ol/geom';
import {
  Group,
  Image as ImageLayer,
  Layer,
  Tile,
  Vector as VectorLayer,
} from 'ol/layer';
import {Vector as VectorSource} from 'ol/source';
import {unByKey} from 'ol/Observable';

import {HS_PRMS} from '../permalink/get-params';
import {HsAddDataOwsService} from '../add-data/url/add-data-ows.service';
import {HsBaseLayerDescriptor} from './base-layer-descriptor.interface';
import {HsConfig} from '../../config.service';
import {HsDimensionTimeService} from '../../common/get-capabilities/dimension-time.service';
import {HsDrawService} from '../draw/draw.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLanguageService} from '../language/language.service';
import {
  HsLayerDescriptor,
  HsLayerLoadProgress,
} from './layer-descriptor.interface';
import {HsLayerEditorVectorLayerService} from './editor/layer-editor-vector-layer.service';
import {HsLayerManagerMetadataService} from './layermanager-metadata.service';
import {HsLayerSelectorService} from './editor/layer-selector.service';
import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsLogService} from '../../common/log/log.service';
import {HsMapService} from '../map/map.service';
import {HsQueuesService} from '../../common/queues/queues.service';
import {HsShareUrlService} from '../permalink/share-url.service';
import {HsToastService} from '../layout/toast/toast.service';
import {HsUtilsService} from '../utils/utils.service';
import {
  SHOW_IN_LAYER_MANAGER,
  getAbstract,
  getActive,
  getBase,
  getCachedCapabilities,
  getCluster,
  getExclusive,
  getLegends,
  getName,
  getOrigLayers,
  getPath,
  getQueryCapabilities,
  getQueryable,
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
  setQueryable,
  setSubLayers,
  setTitle,
} from '../../common/layer-extensions';

class HsLayermanagerDataObject {
  folders: any;
  layers: HsLayerDescriptor[];
  baselayers: HsBaseLayerDescriptor[];
  terrainlayers: any[];
  baselayersVisible: boolean;
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
    (this.folders = {
      //TODO: need to describe how hsl_path works here
      hsl_path: '',
      coded_path: '0-',
      layers: [],
      sub_folders: [],
      indent: 0,
    }),
      /**
       * List of all layers (baselayers are excluded) loaded in LayerManager.
       * @public
       */
      (this.layers = []);
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
    /**
     * Store if baselayers are visible (more precisely one of baselayers)
     * @public
     */
    this.baselayersVisible = true;
    this.filter = '';
  }
}

class HsLayermanagerAppObject {
  map: any;
  data = new HsLayermanagerDataObject();
  timer: any;
  currentLayer: HsLayerDescriptor;
  composition_id: string;
  menuExpanded = false;
  currentResolution: number;
  zIndexValue = 0;
  lastProgressUpdate: number;
  layerEditorElement: any;
  changeResolutionHandler;
  addLayerHandler;
  removeLayerHandler;
  constructor() {}
}

@Injectable({
  providedIn: 'root',
})
export class HsLayerManagerService {
  apps: {
    [id: string]: HsLayermanagerAppObject;
  } = {default: new HsLayermanagerAppObject()};

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
    private zone: NgZone
  ) {
    this.hsEventBusService.layoutLoads.subscribe(
      ({element, innerElement, app}) => {
        if (!this.apps[app]) {
          this.apps[app] = new HsLayermanagerAppObject();
        }
      }
    );

    this.hsEventBusService.layerManagerUpdates.subscribe(({layer, app}) => {
      this.refreshLists(app);
    });
    this.hsEventBusService.layerDimensionDefinitionChanges.subscribe(
      ({layer: olLayer, app}) => {
        if (this.hsDimensionTimeService.layerIsWmsT(olLayer)) {
          const layerDescriptor = this.apps[app ?? 'default'].data.layers.find(
            (ld) => ld.layer == olLayer
          );
          if (layerDescriptor) {
            this.hsDimensionTimeService.setupTimeLayer(layerDescriptor, app);
          }
        }
      }
    );
  }
  get(app: string): HsLayermanagerAppObject {
    if (this.apps[app ?? 'default'] == undefined) {
      this.apps[app ?? 'default'] = new HsLayermanagerAppObject();
    }
    return this.apps[app ?? 'default'];
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
   * @param suspendEvents - If set to true, no new values for layerAdditions, layerManagerUpdates or compositionEdits observables will be emitted. Otherwise will.
   */
  async layerAdded(
    e: {element: Layer<Source>},
    app: string,
    suspendEvents?: boolean
  ): Promise<void> {
    const layer = e.element;
    this.checkLayerHealth(layer);
    const showInLayerManager = getShowInLayerManager(layer) ?? true;
    layer.on('change:visible', (e) => this.layerVisibilityChanged(e, app));
    if (
      this.hsLayerUtilsService.isLayerVectorLayer(layer) &&
      getCluster(layer)
    ) {
      this.hsLayerEditorVectorLayerService.layersClusteredFromStart.push(layer);
      await this.hsLayerEditorVectorLayerService.cluster(
        true,
        layer,
        this.hsConfig.get(app).clusteringDistance || 40,
        false,
        app
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
      grayed: !this.isLayerInResolutionInterval(layer, app),
      visible: layer.getVisible(),
      showInLayerManager,
      uid: this.hsUtilsService.generateUuid(),
      idString() {
        return 'layer' + (this.coded_path || '') + (this.uid || '');
      },
      type: this.getLayerSourceType(layer),
      source: this.getLayerSourceUrl(layer),
    };
    this.loadingEvents(layerDescriptor, app);
    layerDescriptor.trackBy = `${layerDescriptor.uid} ${layerDescriptor.position}`;

    layer.on('propertychange', (event) => {
      if (event.key == 'title') {
        layerDescriptor.title = this.hsLayerUtilsService.getLayerTitle(layer);
      }
      if (event.key == SHOW_IN_LAYER_MANAGER) {
        layerDescriptor.showInLayerManager =
          getShowInLayerManager(layer) ?? true;
      }
    });

    if (getBase(layer) !== true) {
      this.populateFolders(layer, app);
      layerDescriptor.legends = getLegends(layer);
      this.apps[app].data.layers.push(layerDescriptor);
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
          app,
          1,
          5000
        );
        que.push(async (cb) => {
          try {
            await this.hsLayerManagerMetadata.fillMetadata(
              layerDescriptor,
              app
            );
            layerDescriptor.grayed = !this.isLayerInResolutionInterval(
              layer,
              app
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
        this.changeBaseLayerVisibility(true, layerDescriptor, app);
      }
      layerDescriptor.thumbnail = this.getImage(layer, app);
      this.apps[app].data.baselayers.push(
        <HsBaseLayerDescriptor>layerDescriptor
      );
    }

    if (!getName(layer)) {
      setName(layer, getTitle(layer));
    }
    //*NOTE Commented out, because the  following references to this.apps[app].data.baselayer are causing issues.

    // if (layer.getVisible() && getBase(layer)) {
    //   this.apps[app].data.baselayer = this.HsLayerUtilsService.getLayerTitle(layer);
    // }

    this.sortFoldersByZ(app);
    if (!suspendEvents) {
      this.hsEventBusService.layerAdditions.next(layerDescriptor);
      this.hsEventBusService.layerManagerUpdates.next({layer, app});
      this.hsEventBusService.compositionEdits.next({app});
    }
  }

  /**
   * Triage of layer source type and format.
   * Only the commonly used values are listed here, it shall be probably extended in the future.
   * @returns Short description of source type: 'WMS', 'XYZ', 'vector (GeoJSON)' etc.
   */
  getLayerSourceType(layer: Layer<Source>): string {
    if (this.hsLayerUtilsService.isLayerKMLSource(layer)) {
      return `vector (KML)`;
    }
    if (this.hsLayerUtilsService.isLayerGPXSource(layer)) {
      return `vector (GPX)`;
    }
    if (this.hsLayerUtilsService.isLayerGeoJSONSource(layer)) {
      return `vector (GeoJSON)`;
    }
    if (this.hsLayerUtilsService.isLayerTopoJSONSource(layer)) {
      return `vector (TopoJSON)`;
    }
    if (this.hsLayerUtilsService.isLayerVectorLayer(layer)) {
      return 'vector';
    }
    if (this.hsLayerUtilsService.isLayerWMTS(layer)) {
      return 'WMTS';
    }
    if (this.hsLayerUtilsService.isLayerWMS(layer)) {
      return 'WMS';
    }
    if (this.hsLayerUtilsService.isLayerXYZ(layer)) {
      return 'XYZ';
    }
    if (this.hsLayerUtilsService.isLayerArcgis(layer)) {
      return 'ArcGIS';
    }

    if (this.hsLayerUtilsService.isLayerIDW(layer)) {
      return 'IDW';
    }
    this.hsLog.warn(
      `Cannot decide a type of source of layer ${getTitle(layer)}`
    );
    return 'unknown type';
  }

  /**
   * Gets the URL provided in the layer's source, if it is not a data blob or undefined
   * @returns URL provided in the layer's source or 'memory'
   */
  getLayerSourceUrl(layer: Layer<Source>): string {
    const url = this.hsLayerUtilsService.getURL(layer)?.split('?')[0]; //better stripe out any URL params
    if (!url || url.startsWith('data:')) {
      return 'memory';
    }
    return url;
  }

  /**
   * Function for adding baselayer thumbnail visible in basemap gallery.
   * @param layer - Base layer added to map
   */
  getImage(layer: Layer<Source>, app: string): string {
    const thumbnail = getThumbnail(layer);
    const configRef = this.hsConfig.get(app);
    if (thumbnail) {
      if (thumbnail.length > 10) {
        return thumbnail;
      } else {
        return configRef.assetsPath + 'img/' + thumbnail;
      }
    } else {
      return configRef.assetsPath + 'img/default.png';
    }
  }

  /**
   * @param layer
   */
  checkLayerHealth(layer: Layer<Source>): void {
    if (this.isWms(layer)) {
      if (this.hsLayerUtilsService.getLayerParams(layer).LAYERS == undefined) {
        this.hsLog.warn('Layer', layer, 'is missing LAYERS parameter');
      }
    }
  }

  /**
   * @param e
   */
  layerVisibilityChanged(e, app: string): void {
    if (getBase(e.target) != true) {
      for (const layer of this.apps[app].data.layers) {
        if (layer.layer == e.target) {
          layer.visible = e.target.getVisible();
          break;
        }
      }
    } else {
      for (const baseLayer of this.apps[app].data.baselayers) {
        if (baseLayer.layer == e.target) {
          baseLayer.active = e.target.getVisible();
        } else {
          baseLayer.active = false;
        }
      }
    }
  }

  /**
   * Sort layers which are added to map and registered
   * in layermanager by Z and notify components that layer positions have changed.
   */
  updateLayerListPositions(app: string): void {
    //TODO: We could also sort by title or other property. Not supported right now though, just zIndex
    this.apps[app].data.layers = this.sortLayersByZ(
      this.apps[app].data.layers,
      app
    );
  }

  sortLayersByZ(arr: any[], app: string): any[] {
    const minus = this.hsConfig.get(app).reverseLayerList ?? true;
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
  refreshLists(app: string): void {
    const appRef = this.get(app);
    appRef.data.baselayers = Array.from(appRef.data.baselayers);
    appRef.data.terrainlayers = Array.from(appRef.data.terrainlayers);
  }

  /**
   * (PRIVATE) Get layer by its title
   * @private
   * @param title
   */
  getLayerByTitle(title: string, app: string): HsLayerDescriptor | undefined {
    let tmp;
    for (const layer of this.get(app).data.layers) {
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
    app: string
  ): HsLayerDescriptor {
    const layers = base ? 'baselayers' : 'layers';
    const tmp = (this.apps[app].data[layers] as Array<any>).filter(
      (l) => l.layer == layer
    );
    if (tmp.length > 0) {
      return tmp[0];
    }
    return;
  }

  /**
   * Place layer into layer manager folder structure based on path property hsl-path of layer
   * @private
   * @param lyr - Layer to add into folder structure
   */
  populateFolders(lyr: Layer<Source>, app: string): void {
    let path = getPath(lyr);
    if (!path) {
      /* Check whether 'other' folder exists.
        Can not just add getTranslationIgnoreNonExisting string in case no path exists
        because on init the translation is ignored.
      */
      if (
        this.apps[app].data.folders.sub_folders?.filter(
          (f) => f.name == 'other'
        )[0]
      ) {
        path = 'other';
      } else {
        path = this.hsLanguageService.getTranslationIgnoreNonExisting(
          'LAYERMANAGER',
          'other',
          undefined,
          app
        );
      }
      setPath(lyr, path);
    }
    const parts = path.split('/');
    let curfolder = this.apps[app].data.folders;
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
    // if (this.apps[app].data.folders.layers.indexOf(lyr) > -1) {
    //   this.apps[app].data.folders.layers.splice(this.apps[app].data.folders.layers.indexOf(lyr), 1);
    // }
  }

  /**
   * Remove layer from layer folder structure a clean empty folder
   * @private
   * @param lyr - Layer to remove from layer folder
   */
  cleanFolders(lyr: Layer<Source>, app: string): void {
    if (getShowInLayerManager(lyr) == false) {
      return;
    }
    if (getPath(lyr) != undefined && getPath(lyr) !== 'undefined') {
      const path = getPath(lyr);
      const parts = path.split('/');
      let curfolder = this.apps[app].data.folders;
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
          let newfolder = this.apps[app].data.folders;
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
      const ixToRemove = this.apps[app].data.folders.layers.indexOf(lyr);
      if (ixToRemove > -1) {
        this.apps[app].data.folders.layers.splice(ixToRemove, 1);
      }
    }
  }

  /**
   * Callback function for removing layer. Clean layers variables
   * (PRIVATE)
   * @private
   * @param e - Events emitted by ol.Collection instances are instances of this type.
   */
  layerRemoved(e: CollectionEvent<Layer>, app: string): void {
    this.cleanFolders(e.element, app);
    for (let i = 0; i < this.apps[app].data.layers.length; i++) {
      if (this.apps[app].data.layers[i].layer == e.element) {
        this.apps[app].data.layers.splice(i, 1);
      }
    }
    for (let i = 0; i < this.apps[app].data.baselayers.length; i++) {
      if (this.apps[app].data.baselayers[i].layer == e.element) {
        this.apps[app].data.baselayers.splice(i, 1);
      }
    }
    this.removeFromArray(
      this.hsLayerEditorVectorLayerService.layersClusteredFromStart,
      e.element
    );
    this.hsEventBusService.layerManagerUpdates.next({
      layer: e.element,
      app: app,
    });
    this.hsEventBusService.layerRemovals.next(e.element);
    if (getShowInLayerManager(e.element) !== false) {
      this.hsEventBusService.compositionEdits.next({app});
    }
    const layers = this.hsMapService.getMap(app).getLayers().getArray();
    if (this.apps[app].zIndexValue > layers.length) {
      this.apps[app].zIndexValue--;
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
  private boxLayersInit(app: string): void {
    if (this.hsConfig.get(app).box_layers != undefined) {
      this.apps[app].data.box_layers = this.hsConfig.get(app).box_layers;
      for (const box of this.apps[app].data.box_layers) {
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
   * Change visibility of selected layer. If layer has exclusive setting, other layers from same group may be turned invisible
   * @param visibility - Visibility layer should have
   * @param layer - Selected layer - wrapped layer object (layer.layer expected)
   */
  changeLayerVisibility(
    visibility: boolean,
    layer: HsLayerDescriptor,
    app: string
  ): void {
    layer.layer.setVisible(visibility);
    layer.visible = visibility;
    layer.grayed = !this.isLayerInResolutionInterval(layer.layer, app);
    //Set the other exclusive layers invisible - all or the ones with same path based on config
    if (visibility && getExclusive(layer.layer) == true) {
      for (const other_layer of this.apps[app].data.layers) {
        const pathExclusivity = this.hsConfig.get(app).pathExclusivity
          ? getPath(other_layer.layer) == getPath(layer.layer)
          : true;
        if (
          getExclusive(other_layer.layer) == true &&
          other_layer != layer &&
          pathExclusivity
        ) {
          other_layer.layer.setVisible(false);
          other_layer.visible = false;
        }
      }
    }
    if (!visibility && this.hsUtilsService.instOf(layer.layer, VectorLayer)) {
      this.hsEventBusService.LayerManagerLayerVisibilityChanges.next(layer);
    }
  }

  /**
   * Change visibility (on/off) of baselayers, only one baselayer may be visible
   * @param $event - Info about the event change visibility event, used if visibility of only one layer is changed
   * @param layer - Selected layer - wrapped layer object (layer.layer expected)
   */
  changeBaseLayerVisibility($event = null, layer = null, app: string): void {
    if (layer === null || layer.layer != undefined) {
      if (this.apps[app].data.baselayersVisible == true) {
        //*NOTE Currently breaking base layer visibility when loading from composition with custom base layer to
        //other compositions without any base layer
        //*TODO Rewrite this loop hell to more readable code
        if ($event) {
          //&& this.apps[app].data.baselayer != layer.title
          for (const baseLayer of this.apps[app].data.baselayers) {
            const isToggledLayer = baseLayer == layer;
            if (baseLayer.layer) {
              //Dont trigger change:visible event when isToggledLayer = false
              baseLayer.layer.set('visible', isToggledLayer, !isToggledLayer);
              baseLayer.visible = isToggledLayer;
              baseLayer.active = isToggledLayer;
              if (!isToggledLayer) {
                baseLayer.galleryMiniMenu = false;
              }
            }
          }
        } else {
          this.apps[app].data.baselayersVisible = false;
          for (const baseLayer of this.apps[app].data.baselayers) {
            baseLayer.layer.setVisible(false);
            baseLayer.galleryMiniMenu = false;
          }
        }
      } else {
        if ($event) {
          layer.active = true;
          for (const baseLayer of this.apps[app].data.baselayers) {
            const isToggledLayer = baseLayer == layer;
            if (isToggledLayer) {
              baseLayer.layer.setVisible(true);
            }
            baseLayer.active = isToggledLayer;
            baseLayer.visible = isToggledLayer;
          }
        } else {
          for (const baseLayer of this.apps[app].data.baselayers) {
            if (baseLayer.visible == true) {
              baseLayer.layer.setVisible(true);
            }
          }
        }
        this.apps[app].data.baselayersVisible = true;
      }
    } else {
      for (const baseLayer of this.apps[app].data.baselayers) {
        if (baseLayer.type != undefined && baseLayer.type == 'terrain') {
          baseLayer.visible = baseLayer == layer;
          baseLayer.active = baseLayer.visible;
        }
      }
    }
    this.hsEventBusService.LayerManagerBaseLayerVisibilityChanges.next(layer);
  }

  /**
   * Change visibility (on/off) of baselayers, only one baselayer may be visible
   * @param $event - Info about the event change visibility event, used if visibility of only one layer is changed
   * @param layer - Selected layer - wrapped layer object (layer.layer expected)
   */
  changeTerrainLayerVisibility($event, layer, app: string): void {
    for (let i = 0; i < this.apps[app].data.terrainlayers.length; i++) {
      if (
        this.apps[app].data.terrainlayers[i].type != undefined &&
        this.apps[app].data.terrainlayers[i].type == 'terrain'
      ) {
        this.apps[app].data.terrainlayers[i].visible =
          this.apps[app].data.terrainlayers[i] == layer;
        this.apps[app].data.terrainlayers[i].active =
          this.apps[app].data.terrainlayers[i].visible;
      }
    }
    this.hsEventBusService.LayerManagerBaseLayerVisibilityChanges.next(layer);
  }

  /**
   * Remove all non-base layers that were added to the map by user.
   * Doesn't remove layers added through app config (In case we want it to be 'removable', it can be set to true in the config.)
   * (PRIVATE)
   * @private
   */
  removeAllLayers(app: string): void {
    const to_be_removed = [];
    this.hsMapService
      .getMap(app)
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
      this.hsMapService.getMap(app).removeLayer(to_be_removed.shift());
    }
    this.hsDrawService.get(app).addedLayersRemoved = true;
    this.hsDrawService.fillDrawableLayers(app);
  }

  /**
   * Show all layers of particular layer group (when groups are defined)
   * @param theme - Group layer to activate
   */
  activateTheme(theme: Group, app: string): void {
    let switchOn = true;
    if (getActive(theme) == true) {
      switchOn = false;
    }
    setActive(theme, switchOn);
    let baseSwitched = false;
    theme.setVisible(switchOn);
    for (const layer of theme.get('layers')) {
      if (getBase(layer) == true && !baseSwitched) {
        this.changeBaseLayerVisibility(null, null, app);
        baseSwitched = true;
      } else if (getBase(layer) == true) {
        return;
      } else {
        layer.setVisible(switchOn);
      }
    }
  }

  /**
   * Create events for checking if layer is being loaded or is loaded for ol.layer.Image or ol.layer.Tile
   * @param layer - Layer which is being added
   */
  loadingEvents(layer: HsLayerDescriptor, app: string): void {
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
            this.hsEventBusService.layerLoads.next({layer: olLayer, app});
          } else {
            this.hsEventBusService.layerLoadings.next({
              layer: olLayer,
              progress: loadProgress,
              app,
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
            app
          )}`,
          {},
          app
        );
      });
    } else if (this.hsUtilsService.instOf(olLayer, ImageLayer)) {
      source.on('imageloadstart', (event) => {
        loadProgress.loadTotal += 1;
        this.changeLoadCounter(olLayer, loadProgress, 1, app);
      });
      source.on('imageloadend', (event) => {
        loadProgress.error = false;
        this.changeLoadCounter(olLayer, loadProgress, -1, app);
      });
      source.on('imageloaderror', (event) => {
        loadProgress.loaded = true;
        loadProgress.error = true;
        this.hsEventBusService.layerLoads.next({layer: olLayer, app});
      });
    } else if (this.hsUtilsService.instOf(olLayer, Tile)) {
      source.on('tileloadstart', (event) => {
        loadProgress.loadTotal += 1;
        this.changeLoadCounter(olLayer, loadProgress, 1, app);
      });
      source.on('tileloadend', (event) => {
        loadProgress.error = false;
        this.changeLoadCounter(olLayer, loadProgress, -1, app);
      });
      source.on('tileloaderror', (event) => {
        this.changeLoadCounter(olLayer, loadProgress, -1, app);
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
    app: string
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
            this.hsEventBusService.layerLoads.next({layer, app});
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
        ((progress.loadTotal - progress.loadCounter) / progress.loadTotal) * 100
      );
    }
    progress.percents = percents;
    this.hsEventBusService.layerLoadings.next({layer, progress, app});
    //Throttle updating UI a bit for many layers * many tiles
    const delta = new Date().getTime() - this.apps[app].lastProgressUpdate;
    if (percents == 100 || delta > 1000) {
      this.zone.run(() => {
        this.apps[app].lastProgressUpdate = new Date().getTime();
      });
    }
  }

  /**
   * Checks if given layer is a WMS layer
   */
  isWms(layer: Layer<Source>): boolean {
    return (
      this.hsUtilsService.instOf(layer.getSource(), TileWMS) ||
      this.hsUtilsService.instOf(layer.getSource(), ImageWMS) ||
      this.hsUtilsService.instOf(layer.getSource(), TileArcGISRest)
    );
  }

  /**
   * Test if layer (WMS) resolution is within map resolution interval
   * @param lyr - Selected layer
   */
  isLayerInResolutionInterval(lyr: Layer<Source>, app): boolean {
    const cur_res = this.hsMapService.getMap(app).getView().getResolution();
    this.apps[app].currentResolution = cur_res;
    return (
      lyr.getMinResolution() <= cur_res && cur_res <= lyr.getMaxResolution()
    );
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
    app: string
  ): void {
    if (!getCachedCapabilities(layer.layer)) {
      this.hsLayerManagerMetadata.fillMetadata(layer, app);
    }

    if (toToggle == 'sublayers' && layer.hasSublayers != true) {
      return;
    }
    if (this.apps[app].currentLayer != layer) {
      this.toggleCurrentLayer(layer, app);
      if (this.apps[app].menuExpanded) {
        this.apps[app].menuExpanded = false;
      }
      layer[toToggle] = true;
    } else {
      layer[toToggle] = !layer[toToggle];
      if (!layer[control]) {
        this.toggleCurrentLayer(layer, app);
      }
    }
  }

  /**
   * Opens detailed panel for manipulating selected layer and viewing metadata
   * @param layer - Selected layer to edit or view - Wrapped layer object
   */
  toggleCurrentLayer(layer: HsLayerDescriptor, app: string): void | false {
    if (this.apps[app].currentLayer == layer) {
      layer.sublayers = false;
      layer.settings = false;
      this.apps[app].currentLayer = null;
      this.updateGetParam(undefined, app);
    } else {
      this.setCurrentLayer(layer, app);
      return false;
    }
  }

  setCurrentLayer(layer: HsLayerDescriptor, app: string): boolean {
    try {
      this.apps[app].currentLayer = layer;
      this.updateGetParam(layer.title, app);
      if (!layer.checkedSubLayers) {
        layer.checkedSubLayers = {};
        layer.withChildren = {};
      }
      this.hsLayerSelectorService.select(layer, app);
      if (this.hsUtilsService.runningInBrowser()) {
        const layerNode = document.getElementById(layer.idString());
        if (layerNode && this.apps[app].layerEditorElement) {
          this.hsUtilsService.insertAfter(
            this.apps[app].layerEditorElement,
            layerNode
          );
        }
      }
      return false;
    } catch (ex) {
      console.error(ex);
    }
  }

  private updateGetParam(title: string, app: string) {
    const t = {};
    t[HS_PRMS.layerSelected] = title;
    this.hsShareUrlService.updateCustomParams(t, app);
  }

  /**
   * Makes layer greyscale
   * @param layer - Selected layer (currentLayer)
   */
  setGreyscale(layer: HsLayerDescriptor, app): void {
    const layerContainer = this.hsLayoutService.apps[
      app
    ].contentWrapper.querySelector('.ol-layers > div:first-child');
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

  sortFoldersByZ(app: string): void {
    this.apps[app].data.folders.sub_folders.sort(
      (a, b) =>
        (a.zIndex < b.zIndex ? -1 : a.zIndex > b.zIndex ? 1 : 0) *
        (this.hsConfig.get(app).reverseLayerList ?? true ? -1 : 1)
    );
  }

  /**
   * Initialization of needed controllers, run when map object is available
   * (PRIVATE)
   * @private
   */
  async init(app: string): Promise<void> {
    await this.hsMapService.loaded(app);
    this.apps[app].map = this.hsMapService.getMap(app);
    const appRef = this.apps[app];
    for (const lyr of this.hsMapService.getMap(app).getLayers().getArray()) {
      this.applyZIndex(lyr as Layer<Source>, app);
      await this.layerAdded(
        {
          element: lyr as Layer<Source>,
        },
        app,
        true
      );
    }
    this.sortFoldersByZ(app);
    this.sortLayersByZ(appRef.data.layers, app);
    this.hsEventBusService.layerManagerUpdates.next({layer: null, app});
    this.toggleEditLayerByUrlParam(app);
    this.boxLayersInit(app);

    appRef.changeResolutionHandler = appRef.map.getView().on(
      'change:resolution',
      this.hsUtilsService.debounce(
        (e) => this.resolutionChangeDebounceCallback(app),
        200,
        false,
        this
      )
    );

    appRef.addLayerHandler = appRef.map.getLayers().on('add', (e) => {
      this.applyZIndex(e.element, app, true);
      if (getShowInLayerManager(e.element) == false) {
        return;
      }
      this.layerAdded(e, app);
    });
    appRef.removeLayerHandler = appRef.map
      .getLayers()
      .on('remove', (e) => this.layerRemoved(e, app));
  }

  destroy(app: string): void {
    const appRef = this.apps[app];
    unByKey(appRef.changeResolutionHandler);
    unByKey(appRef.addLayerHandler);
    unByKey(appRef.removeLayerHandler);
    delete this.apps[app];
  }

  private resolutionChangeDebounceCallback(app): void {
    setTimeout(() => {
      for (let i = 0; i < this.apps[app].data.layers.length; i++) {
        const tmp = !this.isLayerInResolutionInterval(
          this.apps[app].data.layers[i].layer,
          app
        );
        if (this.apps[app].data.layers[i].grayed != tmp) {
          this.apps[app].data.layers[i].grayed = tmp;
        }
      }
      this.apps[app].timer = null;
    }, 250);
  }

  /**
   * Opens editor for layer specified in 'hs-layer-selected' url parameter
   */
  private toggleEditLayerByUrlParam(app: string) {
    const layerTitle = this.hsShareUrlService.getParamValue(
      HS_PRMS.layerSelected
    );
    if (layerTitle != undefined) {
      setTimeout(() => {
        const layerFound = this.apps[app].data.layers.find(
          (layer) => layer.title == layerTitle
        );
        if (layerFound !== undefined) {
          this.toggleLayerEditor(layerFound, 'settings', 'sublayers', app);
          this.hsEventBusService.layerSelectedFromUrl.next(layerFound.layer);
        }
      }, 500);
    }
  }

  /**
   * Sets zIndex of layer being added to be the highest among layers in same path
   * @param layer - layer being added
   */
  private setPathMaxZIndex(layer: Layer<Source>, app: string): void {
    let pathLayers;
    if (getBase(layer)) {
      pathLayers = this.apps[app].data.baselayers;
    } else {
      let path = getPath(layer);
      //If not set it'll be assigned inside populateFolders function as 'other'
      path = path ? path : 'other';

      pathLayers = this.apps[app].data.layers.filter(
        (layer) => getPath(layer.layer) == path
      );
    }

    if (pathLayers.length > 0) {
      //Get max available index value
      const maxPathZIndex = Math.max(
        ...pathLayers.map((lyr) => lyr.layer.getZIndex() || 0)
      );

      layer.setZIndex(maxPathZIndex + 1);
      //Increase zIndex of the layer that are supposed to be rendered above inserted
      for (const lyr of this.apps[app].data.layers.filter(
        (lyr) => lyr.layer.getZIndex() >= layer.getZIndex()
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
  applyZIndex(layer: Layer<Source>, app: string, asCallback?: boolean): void {
    if (asCallback && getShowInLayerManager(layer) !== false) {
      this.setPathMaxZIndex(layer, app);
    }

    if (layer.getZIndex() == undefined) {
      layer.setZIndex(this.apps[app].zIndexValue++);
    } else {
      this.apps[app].zIndexValue++;
    }
  }

  makeSafeAndTranslate(group: string, input: string, app: string): SafeHtml {
    const translation = this.hsLanguageService.getTranslationIgnoreNonExisting(
      group,
      input,
      undefined,
      app
    );
    if (translation) {
      return this.sanitizer.bypassSecurityTrustHtml(translation);
    } else {
      return '';
    }
  }

  expandFilter(layer: HsLayerDescriptor, value, app: string): void {
    layer.expandFilter = value;
    this.apps[app].currentLayer = layer;
    this.hsLayerSelectorService.select(layer, app);
  }

  expandInfo(layer: HsLayerDescriptor, value): void {
    layer.expandInfo = value;
  }

  /*
    Generates downloadable geoJSON for vector layer.
    Features are also transformed into the EPSG:4326 projection
  */
  saveGeoJson(app): void {
    const geojsonParser = new GeoJSON();
    const olLayer = this.apps[app].currentLayer.layer;
    const geojson = geojsonParser.writeFeatures(
      (this.hsLayerUtilsService.isLayerClustered(olLayer)
        ? (olLayer.getSource() as Cluster).getSource()
        : (olLayer.getSource() as VectorSource<Geometry>)
      ).getFeatures(),
      {
        dataProjection: 'EPSG:4326',
        featureProjection: this.hsMapService.getCurrentProj(app),
      }
    );
    const file = new Blob([geojson], {type: 'application/json'});

    const a = document.createElement('a'),
      url = URL.createObjectURL(file);
    a.href = url;
    a.download = getTitle(this.apps[app].currentLayer.layer).replace(/\s/g, '');
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 0);
  }

  /*
    Creates a copy of the currentLayer
  */
  async copyLayer(newTitle: string, app: string): Promise<void> {
    const copyTitle = this.createCopyTitle(newTitle, app);
    if (
      this.hsLayerUtilsService.isLayerVectorLayer(
        this.apps[app].currentLayer.layer
      )
    ) {
      this.copyVectorLayer(copyTitle, app);
    } else {
      const url = this.hsLayerUtilsService.getURL(
        this.apps[app].currentLayer.layer
      );
      let name = getCachedCapabilities(this.apps[app].currentLayer.layer)?.Name;
      if (!name || typeof name === 'number') {
        name = getName(this.apps[app].currentLayer.layer);
      }
      const layerCopy = await this.hsAddDataOwsService.connectToOWS(
        {
          type: this.getLayerSourceType(
            this.apps[app].currentLayer.layer
          ).toLowerCase(),
          uri: url,
          layer: name,
          getOnly: true,
        },
        app
      );
      if (layerCopy[0]) {
        layerCopy[0].setProperties(
          this.apps[app].currentLayer.layer.getProperties()
        );
        setTitle(layerCopy[0], copyTitle);
        //Currently ticked sub-layers are stored in LAYERS
        const subLayers = this.hsLayerUtilsService.getLayerParams(
          this.apps[app].currentLayer.layer
        )?.LAYERS;
        if (subLayers) {
          setSubLayers(layerCopy[0], subLayers);
        }
        this.hsLayerUtilsService.updateLayerParams(
          layerCopy[0],
          this.hsLayerUtilsService.getLayerParams(
            this.apps[app].currentLayer.layer
          )
        );
        // We don't want the default styles to be set which add-data panel does.
        // Otherwise they won't be cleared if the original layer has undefined STYLES
        // Also we have to set LAYERS to currentLayer original values for composition saving
        this.hsLayerUtilsService.updateLayerParams(layerCopy[0], {
          STYLES: null,
          //Object.assign will ignore it if origLayers is undefined.
          LAYERS: getOrigLayers(this.apps[app].currentLayer.layer),
        });
        this.hsMapService.getMap(app).addLayer(layerCopy[0]);
      }
    }
  }

  /*
    Creates a copy of the currentLayer if it is a vector layer
  */
  copyVectorLayer(newTitle: string, app: string): void {
    let features;
    if (
      this.hsLayerUtilsService.isLayerClustered(
        this.apps[app].currentLayer.layer
      )
    ) {
      features = (this.apps[app].currentLayer.layer.getSource() as Cluster)
        .getSource()
        ?.getFeatures();
    } else {
      features = (
        this.apps[app].currentLayer.layer.getSource() as VectorSource<Geometry>
      )?.getFeatures();
    }

    const copiedLayer = new VectorLayer({
      properties: this.apps[app].currentLayer.layer.getProperties(),
      source: new VectorSource({
        features,
      }),
      style: (
        this.apps[app].currentLayer.layer as VectorLayer<VectorSource<Geometry>>
      ).getStyle(),
    });
    setTitle(copiedLayer, newTitle);
    setName(copiedLayer, getName(this.apps[app].currentLayer.layer));
    this.hsMapService.addLayer(copiedLayer, app);
  }

  /*
    Creates a new title for the copied layer
  */
  createCopyTitle(newTitle: string, app: string): string {
    const layerName = getName(this.apps[app].currentLayer.layer);
    let copyTitle = getTitle(this.apps[app].currentLayer.layer);
    let numb = 0;
    if (newTitle && newTitle !== copyTitle) {
      copyTitle = newTitle;
    } else {
      const layerCopies = this.hsMapService
        .getLayersArray(app)
        .filter((l) => getName(l) == layerName);
      numb = layerCopies !== undefined ? layerCopies.length : 0;
      copyTitle = copyTitle.replace(/\([0-9]\)/g, '').trimEnd();
      copyTitle = copyTitle + ` (${numb})`;
    }
    return copyTitle;
  }
}
