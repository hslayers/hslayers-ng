import '../layers/hs.source.SparqlJson';
import ImageLayer from 'ol/layer/Image';
import VectorLayer from 'ol/layer/Vector';
import {CollectionEvent} from 'ol/Collection';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import {Group, Tile} from 'ol/layer';
import {HsConfig} from '../../config.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLanguageService} from '../language/language.service';
import {HsLayerDescriptor} from './layer-descriptor.interface';
import {HsLayerEditorStylesService} from './layer-editor-styles.service';
import {HsLayerEditorVectorLayerService} from './layer-editor-vector-layer.service';
import {HsLayerManagerMetadataService} from './layermanager-metadata.service';
import {HsLayerManagerWmstService} from './layermanager-wmst.service';
import {HsLayerSelectorService} from './layer-selector.service';
import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsMapService} from '../map/map.service';
import {HsShareUrlService} from '../permalink/share-url.service';
import {HsUtilsService} from '../utils/utils.service';
import {ImageWMS} from 'ol/source';
import {Injectable} from '@angular/core';
import {Layer} from 'ol/layer';
import {METERS_PER_UNIT} from 'ol/proj';
import {TileWMS} from 'ol/source';

@Injectable({
  providedIn: 'root',
})
export class HsLayerManagerService {
  /**
   * @ngdoc property
   * @name HsLayermanagerService#data
   * @public
   * @type {object}
   * @description Containg object for all properties which are shared with controllers.
   */
  data: any = {
    /**
     * @ngdoc property
     * @name HsLayermanagerService.data#folders
     * @public
     * @type {object}
     * @description Folders object for structure of layers. Each level contain 5 properties:
     * hsl_path {String}: Worded path to folder position in folders hiearchy.
     * coded_path {String}: Path encoded in numbers
     * layers {Array}: List of layers for current folder
     * sub_folders {Array}: List of subfolders for current folder
     * indent {Number}: Hiearchy level for current folder
     * name {String}: Optional - only from indent 1, base folder is not named
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
     * @ngdoc property
     * @name HsLayermanagerService.data#layers
     * @public
     * @type {Array}
     * @description List of all layers (overlay layers, baselayers are excluded) loaded in layer manager.
     */
    layers: [],
    /**
     * @ngdoc property
     * @name HsLayermanagerService.data#baselayers
     * @public
     * @type {Array}
     * @description List of all baselayers loaded in layer manager.
     */
    baselayers: [],
    /**
     * @ngdoc property
     * @name HsLayermanagerService.data#terrainlayers
     * @public
     * @type {Array}
     * @description List of all cesium terrain layers loaded in layer manager.
     */
    terrainlayers: [],
    /**
     * @ngdoc property
     * @name HsLayermanagerService.data#baselayersVisible
     * @public
     * @type {boolean}
     * @description Store if baselayers are visible (more precisely one of baselayers)
     */
    baselayersVisible: true,
  };

  //Property for pointer to main map object
  map: any;
  timer: any;
  currentLayer: HsLayerDescriptor;
  composition_id: string;
  menuExpanded = false;
  currentResolution: number;

  constructor(
    public HsMapService: HsMapService,
    public HsUtilsService: HsUtilsService,
    public HsLayerUtilsService: HsLayerUtilsService,
    public HsConfig: HsConfig,
    public HsLayermanagerWmstService: HsLayerManagerWmstService,
    public HsLayerEditorVectorLayerService: HsLayerEditorVectorLayerService,
    public HsLayerManagerMetadata: HsLayerManagerMetadataService,
    public HsEventBusService: HsEventBusService,
    public HsLayoutService: HsLayoutService,
    public HsLayerEditorStylesService: HsLayerEditorStylesService,
    public HsLayerSelectorService: HsLayerSelectorService,
    private sanitizer: DomSanitizer,
    private HsLanguageService: HsLanguageService,
    private HsShareUrlService: HsShareUrlService
  ) {
    this.HsMapService.loaded().then(() => this.init());
  }

  /**
   * @ngdoc method
   * @name HsLayermanagerService#layerAdded
   * @private
   * @param {CollectionEvent} e Event object emited by Ol add layer event
   * @description Function for adding layer added to map into layer manager structure. In service automatically used after layer is added to map. Layers which shouldn´t be in layer manager (show_in_manager property) aren´t added. Loading events and legends URLs are created for each layer. Layers also get automatic watcher for changing visibility (to synchronize visibility in map and layer manager.) Position is calculated for each layer and for time layers time properties are created. Each layer is also inserted in correct layer list and inserted into folder structure.
   */
  layerAdded(e: CollectionEvent): void {
    const layer = e.element;
    this.checkLayerHealth(layer);
    if (
      layer.get('show_in_manager') !== null &&
      layer.get('show_in_manager') == false
    ) {
      return;
    }
    //WMST.layerIsWmsT(layer);
    this.loadingEvents(layer);
    layer.on('change:visible', (e) => this.layerVisibilityChanged(e));
    if (
      this.HsLayerUtilsService.isLayerVectorLayer(layer) &&
      layer.get('cluster') &&
      layer.get('declutter')
    ) {
      layer.set('declutter', false);
    }
    if (
      this.HsLayerUtilsService.isLayerVectorLayer(layer) &&
      layer.get('cluster')
    ) {
      this.HsLayerEditorVectorLayerService.cluster(
        true,
        layer,
        this.HsConfig.clusteringDistance
      );
    }
    if (typeof layer.get('position') == 'undefined') {
      layer.set('position', this.getMyLayerPosition(layer));
    }

    /**
     * @ngdoc property
     * @name HsLayermanagerService#layer
     * @private
     * @type {object}
     * @description Wrapper for layers in layer manager structure. Each layer object stores layer's title, grayed (if layer is currently visible - for layers which have max/min resolution), visible (layer is visible), and actual layer. Each layer wrapper is accessible from layer list or folder structure.
     */
    const new_layer: any = {
      title: this.HsLayerUtilsService.getLayerTitle(layer),
      abstract: layer.get('abstract'),
      layer: layer,
      grayed: this.isLayerInResolutionInterval(layer),
      visible: layer.getVisible(),
      position: layer.get('position'),
      hsFilters: layer.get('hsFilters'),
      uid: this.HsUtilsService.generateUuid(),
      idString() {
        return 'layer' + (this.coded_path || '') + (this.uid || '');
      },
    };
    new_layer.trackBy = layer.ol_uid + ' ' + new_layer.position;

    layer.on('propertychange', (event) => {
      new_layer.title = this.HsLayerUtilsService.getLayerTitle(layer);
    });

    this.HsLayermanagerWmstService.setupTimeLayerIfNeeded(new_layer);

    if (layer.get('base') != true) {
      this.populateFolders(layer);
      if (layer.get('legends')) {
        new_layer.legends = layer.get('legends');
      }
      this.data.layers.push(new_layer);
      if (layer.get('queryCapabilities') != false) {
        this.HsLayerManagerMetadata.fillMetadata(layer).then(() => {
          setTimeout(() => {
            new_layer.grayed = !this.isLayerInResolutionInterval(layer);
          }, 50);
        });
      }
    } else {
      new_layer.active = layer.getVisible();
      (new_layer.thumbnail = this.getImage(layer)),
        this.data.baselayers.push(new_layer);
    }

    if (layer.getVisible() && layer.get('base')) {
      this.data.baselayer = this.HsLayerUtilsService.getLayerTitle(layer);
    }
    this.updateLayerOrder();
    this.HsEventBusService.layerAdditions.next(new_layer);
    this.HsEventBusService.layerManagerUpdates.next(layer);
    this.HsEventBusService.compositionEdits.next();
  }

  /**
   * @ngdoc method
   * @name HsLayermanagerService#getImage
   * @param {Layer} layer Base layer added to map
   * @description Function for adding baselayer thumbnail visible in basemap gallery.
   */
  getImage(layer: Layer) {
    const thumbnail = layer.get('thumbnail');
    if (thumbnail) {
      if (thumbnail.length > 10) {
        return thumbnail;
      } else {
        return require('../../img/' + thumbnail);
      }
    } else {
      return this.HsUtilsService.resolveEsModule(
        require(/* webpackChunkName: "img" */ '../../img/default.png')
      );
    }
  }
  /**
   * @param layer
   */
  checkLayerHealth(layer: Layer): void {
    if (this.isWms(layer)) {
      const src = layer.getSource();
      if (src.getParams().LAYERS == undefined) {
        console.warn('Layer', layer, 'is missing LAYERS parameter');
      }
    }
  }

  /**
   * @param e
   */
  layerVisibilityChanged(e): void {
    if (e.target.get('base') != true) {
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
   * (PRIVATE) Get layer by its title
   *
   * @function getLayerByTitle
   * @memberOf HsLayermanagerService
   * @param {string} title
   * @private
   */
  getLayerByTitle(title: string): Layer | undefined {
    let tmp;
    for (const layer of this.data.layers) {
      if (layer.title == title) {
        tmp = layer;
      }
    }
    return tmp;
  }

  /**
   * @ngdoc method
   * @name HsLayermanagerService#getLayerDescriptorForOlLayer
   * @private
   * @param {Layer} layer to get layer title
   * @returns {object} Layer container which is used in layer-list directive
   * @description Get layer container object for OL layer
   */
  getLayerDescriptorForOlLayer(layer: Layer) {
    const tmp = this.data.layers.filter((l) => l.layer == layer);
    if (tmp.length > 0) {
      return tmp[0];
    }
    return;
  }

  /**
   * @ngdoc method
   * @name HsLayermanagerService#populateFolders
   * @private
   * @param {Layer} lyr Layer to add into folder structure
   * @description Place layer into layer manager folder structure based on path property hsl-path of layer
   */
  populateFolders(lyr: Layer): void {
    if (lyr.get('path') != undefined && lyr.get('path') !== 'undefined') {
      const path = lyr.get('path') || '';
      const parts = path.split('/');
      let curfolder = this.data.folders;
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
            coded_path:
              curfolder.coded_path + curfolder.sub_folders.length + '-',
            visible: true,
          };
          curfolder.sub_folders.push(new_folder);
          curfolder = new_folder;
        } else {
          curfolder = found;
        }
      }
      lyr.coded_path = curfolder.coded_path;
      curfolder.layers.push(lyr);
      if (this.data.folders.layers.indexOf(lyr) > -1) {
        this.data.folders.layers.splice(
          this.data.folders.layers.indexOf(lyr),
          1
        );
      }
    } else {
      this.data.folders.layers.push(lyr);
    }
  }

  /**
   * @ngdoc method
   * @name HsLayermanagerService#cleanFolders
   * @private
   * @param {Layer} lyr Layer to remove from layer folder
   * @description Remove layer from layer folder structure a clean empty folder
   */
  cleanFolders(lyr: Layer): void {
    if (lyr.get('show_in_manager') == false) {
      return;
    }
    if (lyr.get('path') != undefined && lyr.get('path') !== 'undefined') {
      const path = lyr.get('path');
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
   * (PRIVATE)
   *
   * @function layerRemoved
   * @memberOf HsLayermanagerService
   * @private
   * @description Callback function for removing layer. Clean layers variables
   * @param {CollectionEvent} e - Events emitted by ol.Collection instances are instances of this type.
   */
  layerRemoved(e): void {
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
    this.updateLayerOrder();
    this.HsEventBusService.layerManagerUpdates.next(e.element);
    this.HsEventBusService.layerRemovals.next(e.element);
    this.HsEventBusService.compositionEdits.next();
  }

  /**
   * (PRIVATE)
   *
   * @function boxLayersInit
   * @memberOf HsLayermanagerService
   * @description Initilaze box layers and their starting active state
   */
  boxLayersInit(): void {
    if (this.HsConfig.box_layers != undefined) {
      this.data.box_layers = this.HsConfig.box_layers;
      for (const box of this.data.box_layers) {
        let visible = false;
        let baseVisible = false;
        for (const layer of box.get('layers').getArray()) {
          if (layer.get('visible') == true && layer.get('base') == true) {
            baseVisible = true;
          } else if (layer.get('visible') == true) {
            visible = true;
          }
        }
        box.set('active', baseVisible ? baseVisible : visible);
      }
    }
  }

  /**
   * @function changeLayerVisibility
   * @memberOf HsLayermanagerService
   * @description Change visibility of selected layer. If layer has exclusive setting, other layers from same group may be turned unvisible
   * @param {boolean} visibility Visibility layer should have
   * @param {Layer} layer Selected layer - wrapped layer object (layer.layer expected)
   */
  changeLayerVisibility(visibility: boolean, layer: Layer): void {
    layer.layer.setVisible(visibility);
    layer.visible = visibility;
    layer.grayed = !this.isLayerInResolutionInterval(layer.layer);
    //Set the other layers in the same folder invisible
    if (visibility && layer.layer.get('exclusive') == true) {
      for (const other_layer of this.data.layers) {
        if (
          other_layer.layer.get('path') == layer.layer.get('path') &&
          other_layer != layer
        ) {
          other_layer.layer.setVisible(false);
          other_layer.visible = false;
        }
      }
    }
  }

  /**
   * @function changeBaseLayerVisibility
   * @memberOf HsLayermanagerService
   * @description Change visibility (on/off) of baselayers, only one baselayer may be visible
   * @param {object} $event Info about the event change visibility event, used if visibility of only one layer is changed
   * @param {object} layer Selected layer - wrapped layer object (layer.layer expected)
   */
  changeBaseLayerVisibility($event = null, layer = null): void {
    if (layer === null || layer.layer != undefined) {
      if (this.data.baselayersVisible == true) {
        if ($event && this.data.baselayer != layer.title) {
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
              this.data.baselayer = layer.title;
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
              this.data.baselayer = layer.title;
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
          baseLayer.active = baseLayer.visible = baseLayer == layer;
        }
      }
    }
    this.HsEventBusService.LayerManagerBaseLayerVisibilityChanges.next(layer);
  }

  /**
   * @function changeTerrainLayerVisibility
   * @memberOf HsLayermanagerService
   * @description Change visibility (on/off) of baselayers, only one baselayer may be visible
   * @param {object} $event Info about the event change visibility event, used if visibility of only one layer is changed
   * @param {object} layer Selected layer - wrapped layer object (layer.layer expected)
   */
  changeTerrainLayerVisibility($event, layer): void {
    for (let i = 0; i < this.data.terrainlayers.length; i++) {
      if (
        this.data.terrainlayers[i].type != undefined &&
        this.data.terrainlayers[i].type == 'terrain'
      ) {
        this.data.terrainlayers[i].active = this.data.terrainlayers[i].visible =
          this.data.terrainlayers[i] == layer;
      }
    }
    this.HsEventBusService.LayerManagerBaseLayerVisibilityChanges.next(layer);
  }

  /**
   * Update "position" property of layers, so layers could be correctly ordered in GUI
   *
   * @function updateLayerOrder
   * @memberOf HsLayermanagerService
   */
  updateLayerOrder(): void {
    for (const my_layer of this.data.layers) {
      my_layer.layer.set('position', this.getMyLayerPosition(my_layer.layer));
      my_layer.position = my_layer.layer.get('position');
    }
  }

  /**
   * (PRIVATE) Get position of selected layer in map layer order
   *
   * @function getMyLayerPosition
   * @memberOf HsLayermanagerService
   * @private
   * @param {Layer} layer Selected layer
   */
  getMyLayerPosition(layer: Layer): number | null {
    let pos = null;
    for (let i = 0; i < this.HsMapService.map.getLayers().getLength(); i++) {
      if (this.HsMapService.map.getLayers().item(i) == layer) {
        pos = i;
        break;
      }
    }
    return pos;
  }

  /**
   * (PRIVATE)
   *
   * @function removeAllLayers
   * @memberOf HsLayermanagerService
   * @private
   * @description Remove all layers from map
   */
  removeAllLayers(): void {
    const to_be_removed = [];
    this.HsMapService.map.getLayers().forEach((lyr) => {
      if (lyr.get('removable') == undefined || lyr.get('removable') == true) {
        if (lyr.get('base') == undefined || lyr.get('base') == false) {
          if (
            lyr.get('show_in_manager') == undefined ||
            lyr.get('show_in_manager') == true
          ) {
            to_be_removed.push(lyr);
          }
        }
      }
    });
    while (to_be_removed.length > 0) {
      this.HsMapService.map.removeLayer(to_be_removed.shift());
    }
  }

  /**
   * @function activateTheme
   * @memberOf HsLayermanagerService
   * @description Show all layers of particular layer group (when groups are defined)
   * @param {Group} theme Group layer to activate
   */
  activateTheme(theme: Group): void {
    let switchOn = true;
    if (theme.get('active') == true) {
      switchOn = false;
    }
    theme.set('active', switchOn);
    let baseSwitched = false;
    theme.setVisible(switchOn);
    for (const layer of theme.get('layers')) {
      if (layer.get('base') == true && !baseSwitched) {
        this.changeBaseLayerVisibility();
        baseSwitched = true;
      } else if (layer.get('base') == true) {
        return;
      } else {
        layer.setVisible(switchOn);
      }
    }
  }

  /**
   * @function loadingEvents
   * @memberOf HsLayermanagerService
   * @description Create events for checking if layer is being loaded or is loaded for ol.layer.Image or ol.layer.Tile
   * @param {Layer} layer Layer which is being added
   */
  loadingEvents(layer: Layer): void {
    const source = layer.getSource();
    source.loadCounter = 0;
    source.loadTotal = 0;
    source.loadError = 0;
    source.loaded = true;
    if (this.HsUtilsService.instOf(layer, VectorLayer)) {
      layer.getSource().on('propertychange', (event) => {
        if (event.key == 'loaded') {
          if (event.oldValue == false) {
            this.HsEventBusService.layerLoads.next(layer);
          } else {
            this.HsEventBusService.layerLoadings.next(layer);
          }
        }
      });
    } else if (this.HsUtilsService.instOf(layer, ImageLayer)) {
      source.on('imageloadstart', (event) => {
        source.loaded = false;
        source.loadCounter += 1;
        this.HsEventBusService.layerLoadings.next(layer);
      });
      source.on('imageloadend', (event) => {
        source.loaded = true;
        source.loadCounter -= 1;
        this.HsEventBusService.layerLoads.next(layer);
      });
      source.on('imageloaderror', (event) => {
        source.loaded = true;
        source.error = true;
        this.HsEventBusService.layerLoads.next(layer);
      });
    } else if (this.HsUtilsService.instOf(layer, Tile)) {
      source.on('tileloadstart', (event) => {
        source.loadCounter += 1;
        source.loadTotal += 1;
        if (source.loaded == true) {
          source.loaded = false;
          source.set('loaded', false);
          this.HsEventBusService.layerLoadings.next(layer);
        }
      });
      source.on('tileloadend', (event) => {
        source.loadCounter -= 1;
        if (source.loadCounter == 0) {
          source.loaded = true;
          source.set('loaded', true);
          this.HsEventBusService.layerLoads.next(layer);
        }
      });
      source.on('tileloaderror', (event) => {
        source.loadCounter -= 1;
        source.loadError += 1;
        if (source.loadError == source.loadTotal) {
          source.error = true;
        }
        if (source.loadCounter == 0) {
          source.loaded = true;
          source.set('loaded', true);
          this.HsEventBusService.layerLoads.next(layer);
        }
      });
    }
  }

  isWms(layer: Layer): boolean {
    return (
      this.HsUtilsService.instOf(layer.getSource(), TileWMS) ||
      this.HsUtilsService.instOf(layer.getSource(), ImageWMS)
    );
  }

  /**
   * @function isLayerInResolutionInterval
   * @memberOf HsLayermanagerService
   * @param {Layer} lyr Selected layer
   * @description Test if layer (WMS) resolution is within map resolution interval
   */
  isLayerInResolutionInterval(lyr: Layer): boolean {
    if (!lyr.get('visible')) {
      return true;
    }
    let cur_res;
    if (this.isWms(lyr)) {
      const view = this.HsMapService.map.getView();
      const resolution = view.getResolution();
      const units = view.getProjection().getUnits();
      const dpi = 25.4 / 0.28;
      const mpu = METERS_PER_UNIT[units];
      cur_res = resolution * mpu * 39.37 * dpi;
    } else {
      cur_res = this.HsMapService.map.getView().getResolution();
    }
    this.currentResolution = cur_res;
    console.log(this.currentResolution);
    return (
      lyr.getMinResolution() <= cur_res && cur_res <= lyr.getMaxResolution()
    );
  }

  /**
   * @function toggleLayerEditor
   * @memberOf hs.layermanager.controller
   * @description Toggles Additional information panel for current layer.
   * @param {Layer} layer Selected layer (HsLayerManagerService.currentLayer)
   * @param {string} toToggle Part of layer editor to be toggled
   * @param {string} control Part of layer editor to be controlled for state.
   * Determines whether only toggled part or whole layereditor would be closed
   */
  toggleLayerEditor(layer: HsLayerDescriptor, toToggle, control): void {
    if (toToggle == 'sublayers' && layer.layer.hasSublayers != true) {
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
   * @function toggleCurrentLayer
   * @memberOf hs.layermanager.controller
   * @description Opens detailed panel for manipulating selected layer and viewing metadata
   * @param {object} layer Selected layer to edit or view - Wrapped layer object
   */
  toggleCurrentLayer(layer: HsLayerDescriptor): void | false {
    if (this.currentLayer == layer) {
      layer.sublayers = false;
      layer.settings = false;
      this.currentLayer = null;
      this.HsShareUrlService.updateCustomParams({
        'layerSelected': undefined,
      });
    } else {
      this.setCurrentLayer(layer);
      return false;
    }
  }

  setCurrentLayer(layer: HsLayerDescriptor): false {
    this.currentLayer = layer;
    this.HsShareUrlService.updateCustomParams({
      'layerSelected': layer.title,
    });
    if (!layer.layer.checkedSubLayers) {
      layer.layer.checkedSubLayers = {};
      layer.layer.withChildren = {};
    }
    this.HsLayerSelectorService.select(layer);
    if (this.HsLayermanagerWmstService.layerIsWmsT(layer)) {
      this.currentLayer.time = new Date(
        layer.layer.getSource().getParams().TIME
      );
      this.currentLayer.date_increment = this.currentLayer.time.getTime();
    }
    const layerPanel = this.HsLayoutService.contentWrapper.querySelector(
      '.hs-layerpanel'
    );
    const layerNode = document.getElementById(layer.idString());
    if (layerNode) {
      this.HsUtilsService.insertAfter(layerPanel, layerNode);
    }
    return false;
  }

  /**
   * @function hasCopyright
   * @memberOf hs.layermanager.controller
   * @description Determines if layer has metadata information avaliable *
   * @param {HsLayerDescriptor} layer Selected layer (LayMan.currentLayer)
   */
  hasMetadata(layer: HsLayerDescriptor): boolean | undefined {
    if (!layer) {
      return;
    } else {
      return layer.layer.get('MetadataURL') ? true : false;
    }
  }
  /**
   * @function setGreyscale
   * @memberOf hs.layermanager.service
   * @description Makes layer grayscale
   * @param {Layer} layer Selected layer (currentLayer)
   */
  setGreyscale(layer: Layer): void {
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
  /**
   * (PRIVATE)
   *
   * @function init
   * @memberOf HsLayermanagerService
   * @private
   * @description Initialization of needed controllers, run when map object is available
   */
  init(): void {
    this.map = this.HsMapService.map;
    this.HsMapService.map.getLayers().forEach((lyr) => {
      this.layerAdded({
        element: lyr,
      });
    });

    this.boxLayersInit();
    if (this.HsShareUrlService.getParamValue('layerSelected') !== undefined) {
      const selectedLayerTitle = this.HsShareUrlService.getParamValue(
        'layerSelected'
      );
      const layerFound = this.getLayerFromUrl(selectedLayerTitle);
      if (layerFound !== undefined && layerFound.length > 0) {
        this.toggleLayerEditor(layerFound[0], 'settings', 'sublayers');
      }
    }

    this.map.getView().on(
      'change:resolution',
      this.HsUtilsService.debounce(
        () => {
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
        },
        750,
        false,
        this
      )
    );

    this.map.getLayers().on('add', (e) => this.layerAdded(e));
    this.map.getLayers().on('remove', (e) => this.layerRemoved(e));
  }
  getLayerFromUrl(layerTitle: string): any {
    const layerFound = this.data.layers.filter(
      (layer) => layer.title == layerTitle
    );
    return layerFound;
  }
  expandLayer(layer: Layer): void {
    if (layer.expanded == undefined) {
      layer.expanded = true;
    } else {
      layer.expanded = !layer.expanded;
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

  expandSettings(layer: Layer, value): void {
    if (layer.opacity == undefined) {
      layer.opacity = layer.layer.getOpacity();
    }
    if (layer.style == undefined && layer.layer.getSource().styleAble) {
      this.HsLayerEditorStylesService.getLayerStyle(layer);
    }
    layer.expandSettings = value;
  }

  expandFilter(layer: HsLayerDescriptor, value): void {
    layer.expandFilter = value;
    this.currentLayer = layer;
    this.HsLayerSelectorService.select(layer);
  }

  expandInfo(layer: HsLayerDescriptor, value): void {
    layer.expandInfo = value;
  }
}
