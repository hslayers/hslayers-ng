import '../layers/hs.source.SparqlJson';
import 'angular-socialshare';
import ImageLayer from 'ol/layer/Image';
import VectorLayer from 'ol/layer/Vector';
import {ImageWMS} from 'ol/source';
import {METERS_PER_UNIT} from 'ol/proj';
import {Tile} from 'ol/layer';
import {TileWMS} from 'ol/source';

/**
 * @param $rootScope
 * @param HsMapService
 * @param HsUtilsService
 * @param HsLayerUtilsService
 * @param HsConfig
 * @param HsLayermanagerWmstService
 * @param HsLayerEditorVectorLayerService
 * @param HsLayermanagerMetadata
 * @param $timeout
 * @param HsLayoutService
 */
export default function (
  $rootScope,
  HsMapService,
  HsUtilsService,
  HsLayerUtilsService,
  HsConfig,
  HsLayermanagerWmstService,
  HsLayerEditorVectorLayerService,
  HsLayermanagerMetadata,
  $timeout,
  HsLayoutService
) {
  'ngInject';
  const me = {};

  /**
   * @ngdoc property
   * @name HsLayermanagerService#data
   * @public
   * @type {object}
   * @description Containg object for all properties which are shared with controllers.
   */
  me.data = {};

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
  me.data.folders = {
    //TODO: need to describe how hsl_path works here
    hsl_path: '',
    coded_path: '0-',
    layers: [],
    sub_folders: [],
    indent: 0,
  };

  /**
   * @ngdoc property
   * @name HsLayermanagerService.data#layers
   * @public
   * @type {Array}
   * @description List of all layers (overlay layers, baselayers are excluded) loaded in layer manager.
   */
  me.data.layers = [];
  /**
   * @ngdoc property
   * @name HsLayermanagerService.data#baselayers
   * @public
   * @type {Array}
   * @description List of all baselayers loaded in layer manager.
   */
  me.data.baselayers = [];
  /**
   * @ngdoc property
   * @name HsLayermanagerService.data#terrainlayers
   * @public
   * @type {Array}
   * @description List of all cesium terrain layers loaded in layer manager.
   */
  me.data.terrainlayers = [];
  /**
   * @ngdoc property
   * @name HsLayermanagerService.data#baselayersVisible
   * @public
   * @type {boolean}
   * @description Store if baselayers are visible (more precisely one of baselayers)
   */
  me.data.baselayersVisible = true;

  //Property for pointer to main map object
  let map;

  /**
   * @ngdoc method
   * @name HsLayermanagerService#layerAdded
   * @private
   * @param {ol.CollectionEvent} e Event object emited by Ol add layer event
   * @description Function for adding layer added to map into layer manager structure. In service automatically used after layer is added to map. Layers which shouldn´t be in layer manager (show_in_manager property) aren´t added. Loading events and legends URLs are created for each layer. Layers also get automatic watcher for changing visibility (to synchronize visibility in map and layer manager.) Position is calculated for each layer and for time layers time properties are created. Each layer is also inserted in correct layer list and inserted into folder structure.
   */
  function layerAdded(e) {
    const layer = e.element;
    checkLayerHealth(layer);
    if (
      layer.get('show_in_manager') != null &&
      layer.get('show_in_manager') == false
    ) {
      return;
    }
    //WMST.layerIsWmsT(layer);
    const isVector = HsLayerUtilsService.isLayerVectorLayer(layer);
    loadingEvents(layer);
    layer.on('change:visible', layerVisibilityChanged);
    if (isVector && layer.get('cluster') && layer.get('declutter')) {
      layer.set('declutter', false);
    }
    if (isVector && layer.get('cluster')) {
      HsLayerEditorVectorLayerService.cluster(true, layer, '40');
    }
    if (typeof layer.get('position') == 'undefined') {
      layer.set('position', getMyLayerPosition(layer));
    }
    /**
     * @ngdoc property
     * @name HsLayermanagerService#layer
     * @private
     * @type {object}
     * @description Wrapper for layers in layer manager structure. Each layer object stores layer's title, grayed (if layer is currently visible - for layers which have max/min resolution), visible (layer is visible), and actual layer. Each layer wrapper is accessible from layer list or folder structure.
     */
    const new_layer = {
      title: HsLayerUtilsService.getLayerTitle(layer),
      layer: layer,
      visible: layer.getVisible(),
      position: layer.get('position'),
      hsFilters: layer.get('hsFilters'),
      uid: HsUtilsService.generateUuid(),
      idString() {
        return 'layer' + (this.coded_path || '') + (this.uid || '');
      },
    };
    layer.on('propertychange', (event) => {
      new_layer.title = HsLayerUtilsService.getLayerTitle(layer);
    });

    HsLayermanagerWmstService.setupTimeLayerIfNeeded(new_layer);

    if (layer.get('base') != true) {
      populateFolders(layer);
      if (layer.get('legends')) {
        new_layer.legends = layer.get('legends');
      }
      me.data.layers.push(new_layer);
      if (layer.get('queryCapabilities') != false) {
        HsLayermanagerMetadata.fillMetadata(layer).then(() => {
          setTimeout(() => {
            new_layer.grayed = !me.isLayerInResolutionInterval(layer);
          }, 50);
        });
      }
    } else {
      new_layer.active = layer.getVisible();
      (new_layer.thumbnail = getImage(layer)),
        me.data.baselayers.push(new_layer);
    }

    if (layer.getVisible() && layer.get('base')) {
      me.data.baselayer = HsLayerUtilsService.getLayerTitle(layer);
    }
    me.updateLayerOrder();
    $rootScope.$broadcast('layermanager.layer_added', new_layer);
    $rootScope.$broadcast('layermanager.updated', layer);
    $rootScope.$broadcast('compositions.composition_edited');
  }

  /**
   * @ngdoc method
   * @name HsLayermanagerService#getImage
   * @param {layer} layer Base layer added to map
   * @description Function for adding baselayer thumbnail visible in basemap gallery.
   */
  function getImage(layer) {
    const thumbnail = layer.get('thumbnail');
    if (thumbnail) {
      if (thumbnail.length > 10) {
        return thumbnail;
      } else {
        return require('img/' + thumbnail);
      }
    } else {
      return require('img/default.png');
    }
  }
  /**
   * @param layer
   */
  function checkLayerHealth(layer) {
    if (me.isWms(layer)) {
      const src = layer.getSource();
      if (angular.isUndefined(src.getParams().LAYERS)) {
        console.warn('Layer', layer, 'is missing LAYERS parameter');
      }
    }
  }

  /**
   * @param e
   */
  function layerVisibilityChanged(e) {
    if (e.target.get('base') != true) {
      for (var i = 0; i < me.data.layers.length; i++) {
        if (me.data.layers[i].layer == e.target) {
          me.data.layers[i].visible = e.target.getVisible();
          break;
        }
      }
    } else {
      for (var i = 0; i < me.data.baselayers.length; i++) {
        if (me.data.baselayers[i].layer == e.target) {
          me.data.baselayers[i].active = e.target.getVisible();
        } else {
          me.data.baselayers[i].active = false;
        }
      }
    }
  }

  /**
   * (PRIVATE) Get layer by its title
   *
   * @function getLayerByTitle
   * @memberOf HsLayermanagerService
   * @param title
   * @param {object} Hslayers layer
   */
  function getLayerByTitle(title) {
    let tmp;
    angular.forEach(me.data.layers, (layer) => {
      if (layer.title == title) {
        tmp = layer;
      }
    });
    return tmp;
  }

  me.getLayerByTitle = getLayerByTitle;

  /**
   * @ngdoc method
   * @name HsLayermanagerService#getLayerDescriptorForOlLayer
   * @private
   * @param layer
   * @param {Ol.layer} Layer to get layer title
   * @returns {object} Layer container which is used in layer-list directive
   * @description Get layer container object for OL layer
   */
  me.getLayerDescriptorForOlLayer = function (layer) {
    const tmp = me.data.layers.filter((l) => l.layer == layer);
    if (tmp.length > 0) {
      return tmp[0];
    }
    return;
  };

  /**
   * @ngdoc method
   * @name HsLayermanagerService#populateFolders
   * @private
   * @param {object} lyr Layer to add into folder structure
   * @description Place layer into layer manager folder structure based on path property hsl-path of layer
   */
  function populateFolders(lyr) {
    if (angular.isDefined(lyr.get('path')) && lyr.get('path') !== 'undefined') {
      const path = lyr.get('path') || '';
      const parts = path.split('/');
      let curfolder = me.data.folders;
      for (let i = 0; i < parts.length; i++) {
        let found = null;
        angular.forEach(curfolder.sub_folders, (folder) => {
          if (folder.name == parts[i]) {
            found = folder;
          }
        });
        if (found == null) {
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
      if (me.data.folders.layers.indexOf(lyr) > -1) {
        me.data.folders.layers.splice(me.data.folders.layers.indexOf(lyr), 1);
      }
    } else {
      me.data.folders.layers.push(lyr);
    }
  }

  /**
   * @ngdoc method
   * @name HsLayermanagerService#cleanFolders
   * @private
   * @param {ol.Layer} lyr Layer to remove from layer folder
   * @description Remove layer from layer folder structure a clean empty folder
   */
  function cleanFolders(lyr) {
    if (lyr.get('show_in_manager') == false) {
      return;
    }
    if (angular.isDefined(lyr.get('path')) && lyr.get('path') !== 'undefined') {
      const path = lyr.get('path');
      const parts = path.split('/');
      let curfolder = me.data.folders;
      for (var i = 0; i < parts.length; i++) {
        angular.forEach(curfolder.sub_folders, (folder) => {
          if (folder.name == parts[i]) {
            curfolder = folder;
          }
        });
      }

      curfolder.layers.splice(curfolder.layers.indexOf(lyr), 1);
      for (var i = parts.length; i > 0; i--) {
        if (curfolder.layers.length == 0 && curfolder.sub_folders.length == 0) {
          var newfolder = me.data.folders;
          if (i > 1) {
            for (var j = 0; j < i - 1; j++) {
              angular.forEach(newfolder.sub_folders, (folder) => {
                if (folder.name == parts[j]) {
                  newfolder = folder;
                }
              });
            }
          }
          var ixToRemove = newfolder.sub_folders.indexOf(curfolder);
          if (ixToRemove > -1) {
            newfolder.sub_folders.splice(ixToRemove, 1);
          }
          curfolder = newfolder;
        } else {
          break;
        }
      }
    } else {
      var ixToRemove = me.data.folders.layers.indexOf(lyr);
      if (ixToRemove > -1) {
        me.data.folders.layers.splice(ixToRemove, 1);
      }
    }
  }

  /**
   * (PRIVATE)
   *
   * @function layerRemoved
   * @memberOf HsLayermanagerService
   * @description Callback function for removing layer. Clean layers variables
   * @param {ol.CollectionEvent} e - Events emitted by ol.Collection instances are instances of this type.
   */
  function layerRemoved(e) {
    cleanFolders(e.element);
    for (var i = 0; i < me.data.layers.length; i++) {
      if (me.data.layers[i].layer == e.element) {
        me.data.layers.splice(i, 1);
      }
    }

    for (var i = 0; i < me.data.baselayers.length; i++) {
      if (me.data.baselayers[i].layer == e.element) {
        me.data.baselayers.splice(i, 1);
      }
    }
    me.updateLayerOrder();
    $rootScope.$broadcast('layermanager.updated', e.element);
    $rootScope.$broadcast('layer.removed', e.element);
    $rootScope.$broadcast('compositions.composition_edited');
  }

  /**
   * (PRIVATE)
   *
   * @function boxLayersInit
   * @memberOf HsLayermanagerService
   * @description Initilaze box layers and their starting active state
   */
  function boxLayersInit() {
    if (angular.isDefined(HsConfig.box_layers)) {
      me.data.box_layers = HsConfig.box_layers;
      angular.forEach(me.data.box_layers, (box) => {
        let visible = false;
        let baseVisible = false;
        angular.forEach(box.get('layers'), (layer) => {
          if (layer.get('visible') == true && layer.get('base') == true) {
            baseVisible = true;
          } else if (layer.get('visible') == true) {
            visible = true;
          }
        });
        box.set('active', baseVisible ? baseVisible : visible);
      });
    }
  }

  /**
   * @function changeLayerVisibility
   * @memberOf HsLayermanagerService
   * @description Change visibility of selected layer. If layer has exclusive setting, other layers from same group may be turned unvisible
   * @param {boolean} visibility Visibility layer should have
   * @param {object} layer Selected layer - wrapped layer object (layer.layer expected)
   */
  me.changeLayerVisibility = function (visibility, layer) {
    layer.layer.setVisible(visibility);
    layer.visible = visibility;
    //Set the other layers in the same folder invisible
    if (visibility && layer.layer.get('exclusive') == true) {
      angular.forEach(me.data.layers, (other_layer) => {
        if (
          other_layer.layer.get('path') == layer.layer.get('path') &&
          other_layer != layer
        ) {
          other_layer.layer.setVisible(false);
          other_layer.visible = false;
        }
      });
    }
  };
  /**
   * @function changeBaseLayerVisibility
   * @memberOf HsLayermanagerService
   * @description Change visibility (on/off) of baselayers, only one baselayer may be visible
   * @param {object} $event Info about the event change visibility event, used if visibility of only one layer is changed
   * @param {object} layer Selected layer - wrapped layer object (layer.layer expected)
   */
  me.changeBaseLayerVisibility = function ($event, layer) {
    if (angular.isUndefined(layer) || angular.isDefined(layer.layer)) {
      if (me.data.baselayersVisible == true) {
        if ($event && me.data.baselayer != layer.title) {
          for (var i = 0; i < me.data.baselayers.length; i++) {
            if (me.data.baselayers[i].layer) {
              me.data.baselayers[i].layer.setVisible(false);
              me.data.baselayers[i].visible = false;
              me.data.baselayers[i].active = false;
              if (me.data.baselayers[i] != layer) {
                me.data.baselayers[i].galleryMiniMenu = false;
              }
            }
          }
          for (var i = 0; i < me.data.baselayers.length; i++) {
            if (me.data.baselayers[i].layer && me.data.baselayers[i] == layer) {
              me.data.baselayers[i].layer.setVisible(true);
              me.data.baselayers[i].visible = true;
              me.data.baselayers[i].active = true;
              me.data.baselayer = layer.title;
              break;
            }
          }
        } else {
          me.data.baselayersVisible = false;
          for (var i = 0; i < me.data.baselayers.length; i++) {
            me.data.baselayers[i].layer.setVisible(false);
            me.data.baselayers[i].galleryMiniMenu = false;
          }
        }
      } else {
        if ($event) {
          layer.active = true;

          for (var i = 0; i < me.data.baselayers.length; i++) {
            if (me.data.baselayers[i] != layer) {
              me.data.baselayers[i].active = false;
              me.data.baselayers[i].visible = false;
            } else {
              me.data.baselayers[i].layer.setVisible(true);
              me.data.baselayers[i].visible = true;

              me.data.baselayer = layer.title;
            }
          }
        } else {
          for (var i = 0; i < me.data.baselayers.length; i++) {
            if (me.data.baselayers[i].visible == true) {
              me.data.baselayers[i].layer.setVisible(true);
            }
          }
        }
        me.data.baselayersVisible = true;
      }
    } else {
      for (var i = 0; i < me.data.baselayers.length; i++) {
        if (
          angular.isDefined(me.data.baselayers[i].type) &&
          me.data.baselayers[i].type == 'terrain'
        ) {
          me.data.baselayers[i].active = me.data.baselayers[i].visible =
            me.data.baselayers[i] == layer;
        }
      }
    }
    $rootScope.$broadcast('layermanager.base_layer_visible_changed', layer);
  };

  /**
   * @function changeTerrainLayerVisibility
   * @memberOf HsLayermanagerService
   * @description Change visibility (on/off) of baselayers, only one baselayer may be visible
   * @param {object} $event Info about the event change visibility event, used if visibility of only one layer is changed
   * @param {object} layer Selected layer - wrapped layer object (layer.layer expected)
   */
  me.changeTerrainLayerVisibility = function ($event, layer) {
    for (let i = 0; i < me.data.terrainlayers.length; i++) {
      if (
        angular.isDefined(me.data.terrainlayers[i].type) &&
        me.data.terrainlayers[i].type == 'terrain'
      ) {
        me.data.terrainlayers[i].active = me.data.terrainlayers[i].visible =
          me.data.terrainlayers[i] == layer;
      }
    }
    $rootScope.$broadcast('layermanager.base_layer_visible_changed', layer);
  };

  /**
   * Update "position" property of layers, so layers could be correctly ordered in GUI
   *
   * @function updateLayerOrder
   * @memberOf HsLayermanagerService
   */
  me.updateLayerOrder = function () {
    angular.forEach(me.data.layers, (my_layer) => {
      my_layer.layer.set('position', getMyLayerPosition(my_layer.layer));
      my_layer.position = my_layer.layer.get('position');
    });
  };
  /**
   * (PRIVATE) Get position of selected layer in map layer order
   *
   * @function getMyLayerPosition
   * @memberOf HsLayermanagerService
   * @param {Ol.layer} layer Selected layer
   */
  function getMyLayerPosition(layer) {
    let pos = null;
    for (let i = 0; i < HsMapService.map.getLayers().getLength(); i++) {
      if (HsMapService.map.getLayers().item(i) == layer) {
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
   * @description Remove all layers from map
   */
  me.removeAllLayers = function () {
    const to_be_removed = [];
    HsMapService.map.getLayers().forEach((lyr) => {
      if (
        angular.isUndefined(lyr.get('removable')) ||
        lyr.get('removable') == true
      ) {
        if (angular.isUndefined(lyr.get('base')) || lyr.get('base') == false) {
          if (
            angular.isUndefined(lyr.get('show_in_manager')) ||
            lyr.get('show_in_manager') == true
          ) {
            to_be_removed.push(lyr);
          }
        }
      }
    });
    while (to_be_removed.length > 0) {
      HsMapService.map.removeLayer(to_be_removed.shift());
    }
  };

  /**
   * @function activateTheme
   * @memberOf HsLayermanagerService
   * @description Show all layers of particular layer group (when groups are defined)
   * @param {ol.layer.Group} theme Group layer to activate
   */
  me.activateTheme = function (theme) {
    let switchOn = true;
    if (theme.get('active') == true) {
      switchOn = false;
    }
    theme.set('active', switchOn);
    let baseSwitched = false;
    theme.setVisible(switchOn);
    angular.forEach(theme.get('layers'), (layer) => {
      if (layer.get('base') == true && !baseSwitched) {
        me.changeBaseLayerVisibility();
        baseSwitched = true;
      } else if (layer.get('base') == true) {
        return;
      } else {
        layer.setVisible(switchOn);
      }
    });
  };

  /**
   * @function loadingEvents
   * @memberOf HsLayermanagerService
   * @description Create events for checking if layer is being loaded or is loaded for ol.layer.Image or ol.layer.Tile
   * @param {ol.layer} layer Layer which is being added
   */
  function loadingEvents(layer) {
    const source = layer.getSource();
    source.loadCounter = 0;
    source.loadTotal = 0;
    source.loadError = 0;
    source.loaded = true;
    if (HsUtilsService.instOf(layer, VectorLayer)) {
      layer.getSource().on('propertychange', (event) => {
        if (event.key == 'loaded') {
          if (event.oldValue == false) {
            $rootScope.$broadcast('layermanager.layer_loaded', layer);
          } else {
            $rootScope.$broadcast('layermanager.layer_loading', layer);
          }
        }
      });
    } else if (HsUtilsService.instOf(layer, ImageLayer)) {
      source.on('imageloadstart', (event) => {
        source.loaded = false;
        source.loadCounter += 1;
        $rootScope.$broadcast('layermanager.layer_loading', layer);
      });
      source.on('imageloadend', (event) => {
        source.loaded = true;
        source.loadCounter -= 1;
        $rootScope.$broadcast('layermanager.layer_loaded', layer);
      });
      source.on('imageloaderror', (event) => {
        source.loaded = true;
        source.error = true;
        $rootScope.$broadcast('layermanager.layer_loaded', layer);
      });
    } else if (HsUtilsService.instOf(layer, Tile)) {
      source.on('tileloadstart', (event) => {
        source.loadCounter += 1;
        source.loadTotal += 1;
        if (source.loaded == true) {
          source.loaded = false;
          source.set('loaded', false);
          $rootScope.$broadcast('layermanager.layer_loading', layer);
        }
      });
      source.on('tileloadend', (event) => {
        source.loadCounter -= 1;
        if (source.loadCounter == 0) {
          source.loaded = true;
          source.set('loaded', true);
          $rootScope.$broadcast('layermanager.layer_loaded', layer);
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
          $rootScope.$broadcast('layermanager.layer_loaded', layer);
        }
      });
    }
  }

  me.isWms = function (layer) {
    return (
      HsUtilsService.instOf(layer.getSource(), TileWMS) ||
      HsUtilsService.instOf(layer.getSource(), ImageWMS)
    );
  };

  /**
   * @function isLayerInResolutionInterval
   * @memberOf HsLayermanagerService
   * @param {Ol.layer} lyr Selected layer
   * @description Test if layer (WMS) resolution is within map resolution interval.
   */
  me.isLayerInResolutionInterval = function (lyr) {
    if (!lyr.get('visible')) {
      return true;
    }
    let cur_res;
    if (me.isWms(lyr)) {
      const view = HsMapService.map.getView();
      const resolution = view.getResolution();
      const units = map.getView().getProjection().getUnits();
      const dpi = 25.4 / 0.28;
      const mpu = METERS_PER_UNIT[units];
      cur_res = resolution * mpu * 39.37 * dpi;
    } else {
      cur_res = HsMapService.map.getView().getResolution();
    }
    me.currentResolution = cur_res;
    return (
      lyr.getMinResolution() <= cur_res && cur_res <= lyr.getMaxResolution()
    );
  };

  me.setGreyscale = function (layer) {
    const layerContainer = HsLayoutService.contentWrapper.querySelector(
      '.ol-layers > div:first-child'
    );
    if (layerContainer.classList.contains('hs-grayscale')) {
      layerContainer.classList.remove('hs-grayscale');
      layer.grayscale = false;
    } else {
      layerContainer.classList.add('hs-grayscale');
      layer.grayscale = true;
    }
    $timeout(() => {
      layer.galleryMiniMenu = false;
    }, 100);
  };

  let timer = null;
  /**
   * (PRIVATE)
   *
   * @function init
   * @memberOf HsLayermanagerService
   * @description Initialization of needed controllers, run when map object is available
   */
  function init() {
    map = HsMapService.map;
    HsMapService.map.getLayers().forEach((lyr) => {
      layerAdded({
        element: lyr,
      });
    });

    boxLayersInit();

    map.getView().on('change:resolution', (e) => {
      if (timer != null) {
        clearTimeout(timer);
      }
      timer = setTimeout(() => {
        let somethingChanged = false;
        for (let i = 0; i < me.data.layers.length; i++) {
          const tmp = !me.isLayerInResolutionInterval(me.data.layers[i].layer);
          if (me.data.layers[i].grayed != tmp) {
            me.data.layers[i].grayed = tmp;
            somethingChanged = true;
          }
          if (somethingChanged) {
            $timeout(() => {}, 0);
          }
        }
        timer = null;
      }, 500);
    });

    map.getLayers().on('add', layerAdded);
    map.getLayers().on('remove', layerRemoved);
  }

  HsMapService.loaded().then(init);

  return me;
}
