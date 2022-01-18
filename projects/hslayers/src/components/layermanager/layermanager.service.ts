import {DomSanitizer, SafeHtml} from '@angular/platform-browser';

import VectorSource from 'ol/source/Vector';
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
import {Injectable, NgZone} from '@angular/core';

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
import {HsUtilsService} from '../utils/utils.service';
import {
  getAbstract,
  getActive,
  getBase,
  getCachedCapabilities,
  getCluster,
  getExclusive,
  getLegends,
  getName,
  getPath,
  getQueryCapabilities,
  getRemovable,
  getShowInLayerManager,
  getThumbnail,
  getTitle,
  setActive,
  setName,
  setPath,
  setTitle,
} from '../../common/layer-extensions';

@Injectable({
  providedIn: 'root',
})
export class HsLayerManagerService {
  /**
   * Containing object for all properties which are shared with controllers.
   */
  data: {
    folders: any;
    layers: HsLayerDescriptor[];
    baselayers: HsBaseLayerDescriptor[];
    terrainlayers: any[];
    baselayersVisible: boolean;
    baselayer?: string;
    box_layers?: Group[];
    filter: string;
  } = {
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
    folders: {
      //TODO: need to describe how hsl_path works here
      hsl_path: '',
      coded_path: '0-',
      layers: [],
      sub_folders: [],
      indent: 0,
    },

    /**
     * List of all layers (baselayers are excluded) loaded in LayerManager.
     * @public
     */
    layers: [],
    /**
     * List of all baselayers loaded in layer manager.
     * @public
     */
    baselayers: [],
    /**
     * List of all cesium terrain layers loaded in layer manager.
     * @public
     */
    terrainlayers: [],
    /**
     * Store if baselayers are visible (more precisely one of baselayers)
     * @public
     */
    baselayersVisible: true,
    filter: '',
  };

  /**
   * Property for pointer to main map object
   */
  map: any;
  timer: any;
  currentLayer: HsLayerDescriptor;
  composition_id: string;
  menuExpanded = false;
  currentResolution: number;
  zIndexValue = 0;
  lastProgressUpdate: number;
  layerEditorElement: any;
  constructor(
    public HsConfig: HsConfig,
    public HsDimensionTimeService: HsDimensionTimeService,
    public HsDrawService: HsDrawService,
    public HsEventBusService: HsEventBusService,
    public HsLanguageService: HsLanguageService,
    public HsLayerEditorVectorLayerService: HsLayerEditorVectorLayerService,
    public HsLayerManagerMetadata: HsLayerManagerMetadataService,
    public HsLayerSelectorService: HsLayerSelectorService,
    public HsLayerUtilsService: HsLayerUtilsService,
    public HsLayoutService: HsLayoutService,
    public HsLog: HsLogService,
    public HsMapService: HsMapService,
    public HsQueuesService: HsQueuesService,
    public HsAddDataOwsService: HsAddDataOwsService,
    private HsShareUrlService: HsShareUrlService,
    public HsUtilsService: HsUtilsService,
    public sanitizer: DomSanitizer,
    private zone: NgZone
  ) {
    this.HsMapService.loaded().then(() => this.init());
    this.HsEventBusService.layerManagerUpdates.subscribe((val) => {
      this.refreshLists();
    });
    this.HsEventBusService.layerDimensionDefinitionChanges.subscribe(
      ({layer: olLayer}) => {
        if (this.HsDimensionTimeService.layerIsWmsT(olLayer)) {
          const layerDescriptor = this.data.layers.find(
            (ld) => ld.layer == olLayer
          );
          if (layerDescriptor) {
            this.HsDimensionTimeService.setupTimeLayer(layerDescriptor);
          }
        }
      }
    );
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
    suspendEvents?: boolean
  ): Promise<void> {
    const layer = e.element;
    this.checkLayerHealth(layer);
    if (
      getShowInLayerManager(layer) !== null &&
      getShowInLayerManager(layer) == false
    ) {
      return;
    }
    layer.on('change:visible', (e) => this.layerVisibilityChanged(e));
    if (
      this.HsLayerUtilsService.isLayerVectorLayer(layer) &&
      getCluster(layer)
    ) {
      this.HsLayerEditorVectorLayerService.layersClusteredFromStart.push(layer);
      await this.HsLayerEditorVectorLayerService.cluster(
        true,
        layer,
        this.HsConfig.clusteringDistance || 40,
        false
      );
    }
    /**
     * Wrapper for layers in layer manager structure.
     * Each layer object stores layer's title, grayed (if layer is currently visible - for layers which have max/min resolution), visible (layer is visible), and actual layer.
     * Each layer wrapper is accessible from layer list or folder structure.
     * @private
     */
    const layerDescriptor: HsLayerDescriptor = {
      title: this.HsLayerUtilsService.getLayerTitle(layer),
      abstract: getAbstract(layer),
      layer,
      grayed: !this.isLayerInResolutionInterval(layer),
      visible: layer.getVisible(),
      uid: this.HsUtilsService.generateUuid(),
      idString() {
        return 'layer' + (this.coded_path || '') + (this.uid || '');
      },
      type: this.getLayerSourceType(layer),
      source: this.getLayerSourceUrl(layer),
    };
    this.loadingEvents(layerDescriptor);
    layerDescriptor.trackBy = `${layerDescriptor.uid} ${layerDescriptor.position}`;

    layer.on('propertychange', (event) => {
      if (event.key == 'title') {
        layerDescriptor.title = this.HsLayerUtilsService.getLayerTitle(layer);
      }
    });

    if (getBase(layer) !== true) {
      this.populateFolders(layer);
      layerDescriptor.legends = getLegends(layer);
      this.data.layers.push(layerDescriptor);
      if (getQueryCapabilities(layer) !== false) {
        const que = this.HsQueuesService.ensureQueue('wmsGetCapabilities', 1);
        que.push(async (cb) => {
          try {
            await this.HsLayerManagerMetadata.fillMetadata(layerDescriptor);
            layerDescriptor.grayed = !this.isLayerInResolutionInterval(layer);
            cb();
          } catch (err) {
            cb(err);
          }
        });
      }
    } else {
      layerDescriptor.active = layer.getVisible();
      if (layerDescriptor.active) {
        this.changeBaseLayerVisibility(true, layerDescriptor);
      }
      layerDescriptor.thumbnail = this.getImage(layer);
      this.data.baselayers.push(<HsBaseLayerDescriptor>layerDescriptor);
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
      this.HsEventBusService.layerAdditions.next(layerDescriptor);
      this.HsEventBusService.layerManagerUpdates.next(layer);
      this.HsEventBusService.compositionEdits.next();
    }
  }

  /**
   * Triage of layer source type and format.
   * Only the commonly used values are listed here, it shall be probably extended in the future.
   * @returns Short description of source type: 'WMS', 'XYZ', 'vector (GeoJSON)' etc.
   */
  getLayerSourceType(layer: Layer<Source>): string {
    if (this.HsLayerUtilsService.isLayerKMLSource(layer)) {
      return `vector (KML)`;
    }
    if (this.HsLayerUtilsService.isLayerGPXSource(layer)) {
      return `vector (GPX)`;
    }
    if (this.HsLayerUtilsService.isLayerGeoJSONSource(layer)) {
      return `vector (GeoJSON)`;
    }
    if (this.HsLayerUtilsService.isLayerTopoJSONSource(layer)) {
      return `vector (TopoJSON)`;
    }
    if (this.HsLayerUtilsService.isLayerVectorLayer(layer)) {
      return 'vector';
    }
    if (this.HsLayerUtilsService.isLayerWMTS(layer)) {
      return 'WMTS';
    }
    if (this.HsLayerUtilsService.isLayerWMS(layer)) {
      return 'WMS';
    }
    if (this.HsLayerUtilsService.isLayerXYZ(layer)) {
      return 'XYZ';
    }
    if (this.HsLayerUtilsService.isLayerArcgis(layer)) {
      return 'ARCGIS';
    }
    this.HsLog.warn(
      `Cannot decide a type of source of layer ${getTitle(layer)}`
    );
    return 'unknown type';
  }

  /**
   * Gets the URL provided in the layer's source, if it is not a data blob or undefined
   * @returns URL provided in the layer's source or 'memory'
   */
  getLayerSourceUrl(layer: Layer<Source>): string {
    const url = this.HsLayerUtilsService.getURL(layer)?.split('?')[0]; //better stripe out any URL params
    if (!url || url.startsWith('data:')) {
      return 'memory';
    }
    return url;
  }

  /**
   * Function for adding baselayer thumbnail visible in basemap gallery.
   * @param layer - Base layer added to map
   */
  getImage(layer: Layer<Source>): string {
    const thumbnail = getThumbnail(layer);
    if (thumbnail) {
      if (thumbnail.length > 10) {
        return thumbnail;
      } else {
        return this.HsUtilsService.getAssetsPath() + 'img/' + thumbnail;
      }
    } else {
      return this.HsUtilsService.getAssetsPath() + 'img/default.png';
    }
  }

  /**
   * @param layer
   */
  checkLayerHealth(layer: Layer<Source>): void {
    if (this.isWms(layer)) {
      if (this.HsLayerUtilsService.getLayerParams(layer).LAYERS == undefined) {
        this.HsLog.warn('Layer', layer, 'is missing LAYERS parameter');
      }
    }
  }

  /**
   * @param e
   */
  layerVisibilityChanged(e): void {
    if (getBase(e.target) != true) {
      for (const layer of this.data.layers) {
        if (layer.layer == e.target) {
          layer.visible = e.target.getVisible();
          break;
        }
      }
    } else {
      for (const baseLayer of this.data.baselayers) {
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
  updateLayerListPositions(): void {
    //TODO: We could also sort by title or other property. Not supported right now though, just zIndex
    this.data.layers = this.sortLayersByZ(this.data.layers);
  }

  sortLayersByZ(arr: any[]): any[] {
    const minus = this.HsConfig.reverseLayerList ?? true;
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
   * @param title
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
   * @returns Layer container which is used in layer-list directive
   */
  getLayerDescriptorForOlLayer(layer: Layer<Source>): HsLayerDescriptor {
    const tmp = this.data.layers.filter((l) => l.layer == layer);
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
  populateFolders(lyr: Layer<Source>): void {
    let path = getPath(lyr);
    if (!path) {
      /* Check whether 'other' folder exists.
        Can not just add getTranslationIgnoreNonExisting string in case no path exists
        because on init the translation is ignored.
      */
      if (this.data.folders.sub_folders?.filter((f) => f.name == 'other')[0]) {
        path = 'other';
      } else {
        path = this.HsLanguageService.getTranslationIgnoreNonExisting(
          'LAYERMANAGER',
          'other'
        );
      }
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
  layerRemoved(e: CollectionEvent): void {
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
      this.HsLayerEditorVectorLayerService.layersClusteredFromStart,
      e.element
    );
    this.HsEventBusService.layerManagerUpdates.next(e.element);
    this.HsEventBusService.layerRemovals.next(e.element);
    this.HsEventBusService.compositionEdits.next();
    const layers = this.HsMapService.map.getLayers().getArray();
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
    if (this.HsConfig.box_layers != undefined) {
      this.data.box_layers = this.HsConfig.box_layers;
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
        setActive(box, baseVisible ? baseVisible : visible);
      }
    }
  }

  /**
   * Change visibility of selected layer. If layer has exclusive setting, other layers from same group may be turned invisible
   * @param visibility - Visibility layer should have
   * @param layer - Selected layer - wrapped layer object (layer.layer expected)
   */
  changeLayerVisibility(visibility: boolean, layer: HsLayerDescriptor): void {
    layer.layer.setVisible(visibility);
    layer.visible = visibility;
    layer.grayed = !this.isLayerInResolutionInterval(layer.layer);
    //Set the other exclusive layers invisible - all or the ones with same path based on config
    if (visibility && getExclusive(layer.layer) == true) {
      for (const other_layer of this.data.layers) {
        const pathExclusivity = this.HsConfig.pathExclusivity
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
    if (!visibility && this.HsUtilsService.instOf(layer.layer, VectorLayer)) {
      this.HsEventBusService.LayerManagerLayerVisibilityChanges.next(layer);
    }
  }

  /**
   * Change visibility (on/off) of baselayers, only one baselayer may be visible
   * @param $event - Info about the event change visibility event, used if visibility of only one layer is changed
   * @param layer - Selected layer - wrapped layer object (layer.layer expected)
   */
  changeBaseLayerVisibility($event = null, layer = null): void {
    if (layer === null || layer.layer != undefined) {
      if (this.data.baselayersVisible == true) {
        //*NOTE Currently breaking base layer visibility when loading from composition with custom base layer to
        //other compositions without any base layer
        //*TODO Rewrite this loop hell to more readable code
        if ($event) {
          //&& this.data.baselayer != layer.title
          for (const baseLayer of this.data.baselayers) {
            if (baseLayer.layer) {
              baseLayer.layer.setVisible(false);
              baseLayer.visible = false;
              baseLayer.active = false;
              if (baseLayer != layer) {
                baseLayer.galleryMiniMenu = false;
              }
            }
          }
          for (const baseLayer of this.data.baselayers) {
            if (baseLayer.layer && baseLayer == layer) {
              baseLayer.layer.setVisible(true);
              baseLayer.visible = true;
              baseLayer.active = true;
              //this.data.baselayer = layer.title;
              break;
            }
          }
        } else {
          this.data.baselayersVisible = false;
          for (const baseLayer of this.data.baselayers) {
            baseLayer.layer.setVisible(false);
            baseLayer.galleryMiniMenu = false;
          }
        }
      } else {
        if ($event) {
          layer.active = true;
          for (const baseLayer of this.data.baselayers) {
            if (baseLayer != layer) {
              baseLayer.active = false;
              baseLayer.visible = false;
            } else {
              baseLayer.layer.setVisible(true);
              baseLayer.visible = true;
              //this.data.baselayer = layer.title;
            }
          }
        } else {
          for (const baseLayer of this.data.baselayers) {
            if (baseLayer.visible == true) {
              baseLayer.layer.setVisible(true);
            }
          }
        }
        this.data.baselayersVisible = true;
      }
    } else {
      for (const baseLayer of this.data.baselayers) {
        if (baseLayer.type != undefined && baseLayer.type == 'terrain') {
          baseLayer.visible = baseLayer == layer;
          baseLayer.active = baseLayer.visible;
        }
      }
    }
    this.HsEventBusService.LayerManagerBaseLayerVisibilityChanges.next(layer);
  }

  /**
   * Change visibility (on/off) of baselayers, only one baselayer may be visible
   * @param $event - Info about the event change visibility event, used if visibility of only one layer is changed
   * @param layer - Selected layer - wrapped layer object (layer.layer expected)
   */
  changeTerrainLayerVisibility($event, layer): void {
    for (let i = 0; i < this.data.terrainlayers.length; i++) {
      if (
        this.data.terrainlayers[i].type != undefined &&
        this.data.terrainlayers[i].type == 'terrain'
      ) {
        this.data.terrainlayers[i].visible =
          this.data.terrainlayers[i] == layer;
        this.data.terrainlayers[i].active = this.data.terrainlayers[i].visible;
      }
    }
    this.HsEventBusService.LayerManagerBaseLayerVisibilityChanges.next(layer);
  }

  /**
   * Remove all non-base layers that were added to the map by user.
   * Doesn't remove layers added through app config (In case we want it to be 'removable', it can be set to true in the config.)
   * (PRIVATE)
   * @private
   */
  removeAllLayers(): void {
    const to_be_removed = [];
    this.HsMapService.map.getLayers().forEach((lyr: Layer<Source>) => {
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
      this.HsMapService.map.removeLayer(to_be_removed.shift());
    }
    this.HsDrawService.addedLayersRemoved = true;
    this.HsDrawService.fillDrawableLayers();
  }

  /**
   * Show all layers of particular layer group (when groups are defined)
   * @param theme - Group layer to activate
   */
  activateTheme(theme: Group): void {
    let switchOn = true;
    if (getActive(theme) == true) {
      switchOn = false;
    }
    setActive(theme, switchOn);
    let baseSwitched = false;
    theme.setVisible(switchOn);
    for (const layer of theme.get('layers')) {
      if (getBase(layer) == true && !baseSwitched) {
        this.changeBaseLayerVisibility();
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
  loadingEvents(layer: HsLayerDescriptor): void {
    const olLayer = layer.layer;
    const source: any = olLayer.getSource();
    const loadProgress = {
      loadCounter: 0,
      loadTotal: 0,
      loadError: 0,
      loaded: true,
      error: undefined,
      percents: 0,
    };
    layer.loadProgress = loadProgress;
    if (this.HsUtilsService.instOf(olLayer, VectorLayer)) {
      source.on('propertychange', (event) => {
        if (event.key == 'loaded') {
          if (event.oldValue == false) {
            this.HsEventBusService.layerLoads.next(olLayer);
          } else {
            this.HsEventBusService.layerLoadings.next({
              layer: olLayer,
              progress: loadProgress,
            });
          }
        }
      });
    } else if (this.HsUtilsService.instOf(olLayer, ImageLayer)) {
      source.on('imageloadstart', (event) => {
        loadProgress.loadTotal += 1;
        this.changeLoadCounter(olLayer, loadProgress, 1);
      });
      source.on('imageloadend', (event) => {
        this.changeLoadCounter(olLayer, loadProgress, -1);
      });
      source.on('imageloaderror', (event) => {
        loadProgress.loaded = true;
        loadProgress.error = true;
        this.HsEventBusService.layerLoads.next(olLayer);
      });
    } else if (this.HsUtilsService.instOf(olLayer, Tile)) {
      source.on('tileloadstart', (event) => {
        loadProgress.loadTotal += 1;
        this.changeLoadCounter(olLayer, loadProgress, 1);
      });
      source.on('tileloadend', (event) => {
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
    change: number
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
            this.HsEventBusService.layerLoads.next(layer);
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
    this.HsEventBusService.layerLoadings.next({layer, progress});
    //Throttle updating UI a bit for many layers * many tiles
    const delta = new Date().getTime() - this.lastProgressUpdate;
    if (percents == 100 || delta > 1000) {
      this.zone.run(() => {
        this.lastProgressUpdate = new Date().getTime();
      });
    }
  }

  /**
   * Checks if given layer is a WMS layer
   */
  isWms(layer: Layer<Source>): boolean {
    return (
      this.HsUtilsService.instOf(layer.getSource(), TileWMS) ||
      this.HsUtilsService.instOf(layer.getSource(), ImageWMS) ||
      this.HsUtilsService.instOf(layer.getSource(), TileArcGISRest)
    );
  }

  /**
   * Test if layer (WMS) resolution is within map resolution interval
   * @param lyr - Selected layer
   */
  isLayerInResolutionInterval(lyr: Layer<Source>): boolean {
    const cur_res = this.HsMapService.map.getView().getResolution();
    this.currentResolution = cur_res;
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
    control: string
  ): void {
    if (toToggle == 'sublayers' && layer.hasSublayers != true) {
      return;
    }
    if (this.currentLayer != layer) {
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
    if (this.currentLayer == layer) {
      layer.sublayers = false;
      layer.settings = false;
      this.currentLayer = null;
      this.updateGetParam(undefined);
    } else {
      this.setCurrentLayer(layer);
      return false;
    }
  }

  setCurrentLayer(layer: HsLayerDescriptor): boolean {
    try {
      this.currentLayer = layer;
      this.updateGetParam(layer.title);
      if (!layer.checkedSubLayers) {
        layer.checkedSubLayers = {};
        layer.withChildren = {};
      }
      this.HsLayerSelectorService.select(layer);
      if (this.HsUtilsService.runningInBrowser()) {
        const layerNode = document.getElementById(layer.idString());
        if (layerNode && this.layerEditorElement) {
          this.HsUtilsService.insertAfter(this.layerEditorElement, layerNode);
        }
      }
      return false;
    } catch (ex) {
      console.error(ex);
    }
  }

  private updateGetParam(title: string) {
    const t = {};
    t[HS_PRMS.layerSelected] = title;
    this.HsShareUrlService.updateCustomParams(t);
  }

  /**
   * Makes layer grayscale
   * @param layer - Selected layer (currentLayer)
   */
  setGreyscale(layer: HsLayerDescriptor): void {
    const layerContainer = this.HsLayoutService.contentWrapper.querySelector(
      '.ol-layers > div:first-child'
    );
    if (layerContainer.classList.contains('hs-grayscale')) {
      layerContainer.classList.remove('hs-grayscale');
      layer.grayscale = false;
    } else {
      layerContainer.classList.add('hs-grayscale');
      layer.grayscale = true;
    }
    setTimeout(() => {
      layer.galleryMiniMenu = false;
    }, 100);
  }

  sortFoldersByZ(): void {
    this.data.folders.sub_folders.sort(
      (a, b) =>
        (a.zIndex < b.zIndex ? -1 : a.zIndex > b.zIndex ? 1 : 0) *
        (this.HsConfig.reverseLayerList ?? true ? -1 : 1)
    );
  }

  /**
   * Initialization of needed controllers, run when map object is available
   * (PRIVATE)
   * @private
   */
  async init(): Promise<void> {
    this.map = this.HsMapService.map;
    for (const lyr of this.HsMapService.map.getLayers().getArray()) {
      this.applyZIndex(lyr as Layer<Source>);
      await this.layerAdded(
        {
          element: lyr as Layer<Source>,
        },
        true
      );
    }
    this.sortFoldersByZ();
    this.sortLayersByZ(this.data.layers);
    this.HsEventBusService.layerManagerUpdates.next();
    this.toggleEditLayerByUrlParam();
    this.boxLayersInit();

    this.map
      .getView()
      .on(
        'change:resolution',
        this.HsUtilsService.debounce(
          this.resolutionChangeDebounceCallback,
          200,
          false,
          this
        )
      );

    this.map.getLayers().on('add', (e) => {
      this.applyZIndex(e.element, true);
      if (getShowInLayerManager(e.element) == false) {
        return;
      }
      this.layerAdded(e);
    });
    this.map.getLayers().on('remove', (e) => this.layerRemoved(e));
  }

  private resolutionChangeDebounceCallback(): void {
    setTimeout(() => {
      for (let i = 0; i < this.data.layers.length; i++) {
        const tmp = !this.isLayerInResolutionInterval(
          this.data.layers[i].layer
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
    const layerTitle = this.HsShareUrlService.getParamValue(
      HS_PRMS.layerSelected
    );
    if (layerTitle != undefined) {
      setTimeout(() => {
        const layerFound = this.data.layers.find(
          (layer) => layer.title == layerTitle
        );
        if (layerFound !== undefined) {
          this.toggleLayerEditor(layerFound, 'settings', 'sublayers');
          this.HsEventBusService.layerSelectedFromUrl.next(layerFound.layer);
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
      path = path ? path : 'other';

      pathLayers = this.data.layers.filter(
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
      for (const lyr of this.data.layers.filter(
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
    const translation = this.HsLanguageService.getTranslationIgnoreNonExisting(
      group,
      input
    );
    if (translation) {
      return this.sanitizer.bypassSecurityTrustHtml(translation);
    } else {
      return '';
    }
  }

  expandFilter(layer: HsLayerDescriptor, value): void {
    layer.expandFilter = value;
    this.currentLayer = layer;
    this.HsLayerSelectorService.select(layer);
  }

  expandInfo(layer: HsLayerDescriptor, value): void {
    layer.expandInfo = value;
  }

  /*
    Generates downloadable geoJSON for vector layer.
    Features are also transformed into the EPSG:4326 projection
  */
  saveGeoJson(): void {
    const geojsonParser = new GeoJSON();
    const olLayer = this.currentLayer.layer;
    const geojson = geojsonParser.writeFeatures(
      (this.HsLayerUtilsService.isLayerClustered(olLayer)
        ? (olLayer.getSource() as Cluster).getSource()
        : (olLayer.getSource() as VectorSource<Geometry>)
      ).getFeatures(),
      {
        dataProjection: 'EPSG:4326',
        featureProjection: this.HsMapService.getCurrentProj(),
      }
    );
    const file = new Blob([geojson], {type: 'application/json'});

    const a = document.createElement('a'),
      url = URL.createObjectURL(file);
    a.href = url;
    a.download = getTitle(this.currentLayer.layer).replace(/\s/g, '');
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 0);
  }

  /*
    Creats a copy of the currentLayer
  */
  async copyLayer(newTitle: string): Promise<void> {
    const copyTitle = this.createCopyTitle(newTitle);
    if (this.HsLayerUtilsService.isLayerVectorLayer(this.currentLayer.layer)) {
      this.copyVectorLayer(copyTitle);
    } else {
      const url = this.HsLayerUtilsService.getURL(this.currentLayer.layer);
      const name =
        getCachedCapabilities(this.currentLayer.layer)?.Name ??
        getName(this.currentLayer.layer);
      const layerAdded = await this.HsAddDataOwsService.connectToOWS({
        type: this.getLayerSourceType(this.currentLayer.layer).toLowerCase(),
        uri: url,
        layer: name,
      });
      setTitle(layerAdded[0], copyTitle);
    }
  }

  /*
    Creats a copy of the currentLayer if it is a vector layer
  */
  copyVectorLayer(newTitle: string): void {
    let features;
    if (this.HsLayerUtilsService.isLayerClustered(this.currentLayer.layer)) {
      features = (this.currentLayer.layer.getSource() as Cluster)
        .getSource()
        ?.getFeatures();
    } else {
      features = (
        this.currentLayer.layer.getSource() as VectorSource<Geometry>
      )?.getFeatures();
    }

    const copiedLayer = new VectorLayer({
      properties: this.currentLayer.layer.getProperties(),
      source: new VectorSource({
        features,
      }),
      style: (
        this.currentLayer.layer as VectorLayer<VectorSource<Geometry>>
      ).getStyle(),
    });
    setTitle(copiedLayer, newTitle);
    this.HsMapService.addLayer(copiedLayer);
  }

  /*
    Creats a new title for the copied layer
  */
  createCopyTitle(newTitle: string): string {
    const layerName = getName(this.currentLayer.layer);
    let copyTitle = getTitle(this.currentLayer.layer);
    let numb = 0;
    if (newTitle && newTitle !== copyTitle) {
      copyTitle = newTitle;
    } else {
      const layerCopies = this.HsMapService.getLayersArray().filter(
        (l) => getName(l) == layerName
      );
      layerCopies.forEach((l) => {
        const numberInTitle = Number(getTitle(l).replace(/\D/g, ''));
        if (numberInTitle > numb) {
          numb = numberInTitle;
        }
      });
      numb !== 0
        ? (copyTitle = layerName + ` (${numb + 1})`)
        : (copyTitle = copyTitle + ' (1)');
    }
    return copyTitle;
  }
}
