import { Tile, Group } from 'ol/layer';
import ImageLayer from 'ol/layer/Image';
import VectorLayer from 'ol/layer/Vector';
import SparqlJson from 'hs.source.SparqlJson'
import 'angular-socialshare';
import { TileWMS, WMTS } from 'ol/source';
import { ImageWMS, ImageArcGISRest } from 'ol/source';
import { METERS_PER_UNIT } from 'ol/proj';
import layermanagerComponent from './layermanager.component';
import { WMSCapabilities, WMTSCapabilities } from 'ol/format';
import WFS from 'ol/format';


export default ['$rootScope', 'hs.map.service', 'Core', 'hs.utils.service', 'hs.utils.layerUtilsService', 'config', 'hs.layermanager.WMSTservice',
    'hs.wmts.getCapabilitiesService', 'hs.wfs.getCapabilitiesService', 'hs.wms.getCapabilitiesService', 'hs.layerEditorVectorLayer.service',
    function ($rootScope, OlMap, Core, utils, layerUtils, config, WMST, WMTSgetCapabilitiesService, WFSgetCapabilitiesService, WMSgetCapabilitiesService, vectorLayerService) {
        var me = {};

        /**
        * @ngdoc property
        * @name hs.layermanager.service#data
        * @public
        * @type {Object} 
        * @description Containg object for all properties which are shared with controllers.
        */
        me.data = {};

        /**
        * @ngdoc property
        * @name hs.layermanager.service.data#folders
        * @public
        * @type {Object}
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
            indent: 0
        };

        /**
        * @ngdoc property
        * @name hs.layermanager.service.data#layers
        * @public
        * @type {Array}
        * @description List of all layers (overlay layers, baselayers are excluded) loaded in layer manager.
        */
        me.data.layers = [];
        /**
        * @ngdoc property
        * @name hs.layermanager.service.data#baselayers
        * @public
        * @type {Array} 
        * @description List of all baselayers loaded in layer manager.
        */
        me.data.baselayers = [];
        /**
        * @ngdoc property
        * @name hs.layermanager.service.data#terrainlayers
        * @public
        * @type {Array} 
        * @description List of all cesium terrain layers loaded in layer manager.
        */
        me.data.terrainlayers = [];
        /**
        * @ngdoc property
        * @name hs.layermanager.service.data#baselayersVisible
        * @public
        * @type {Boolean}
        * @description Store if baselayers are visible (more precisely one of baselayers)
        */
        me.data.baselayersVisible = true;

        //Property for pointer to main map object
        var map;

        /**
         * @ngdoc method
         * @name hs.layermanager.service#layerAdded
         * @private
         * @param {ol.CollectionEvent} e Event object emited by Ol add layer event
         * @description Function for adding layer added to map into layer manager structure. In service automatically used after layer is added to map. Layers which shouldn´t be in layer manager (show_in_manager property) aren´t added. Loading events and legends URLs are created for each layer. Layers also get automatic watcher for changing visibility (to synchronize visibility in map and layer manager.) Position is calculated for each layer and for time layers time properties are created. Each layer is also inserted in correct layer list and inserted into folder structure.
         */
        function layerAdded(e) {
            var layer = e.element;
            checkLayerHealth(layer);
            if (layer.get('show_in_manager') != null && layer.get('show_in_manager') == false) return;
            //WMST.layerIsWmsT(layer);
            loadingEvents(layer);
            layer.on('change:visible', layerVisibilityChanged)
            if (layerUtils.isLayerVectorLayer(layer) && layer.get('cluster') && layer.get('declutter')) layer.set('declutter',false);
            if (layerUtils.isLayerVectorLayer(layer) && layer.get('cluster')) vectorLayerService.cluster(true, layer, "40");
            if (typeof layer.get('position') == 'undefined') layer.set('position', getMyLayerPosition(layer));
            /**
            * @ngdoc property
            * @name hs.layermanager.service#layer
            * @private
            * @type {Object}
            * @description Wrapper for layers in layer manager structure. Each layer object stores layer's title, grayed (if layer is currently visible - for layers which have max/min resolution), visible (layer is visible), and actual layer. Each layer wrapper is accessible from layer list or folder structure.
            */
            var new_layer = {
                title: layerUtils.getLayerTitle(layer),
                layer: layer,
                grayed: me.isLayerInResolutionInterval(layer),
                visible: layer.getVisible(),
                position: layer.get('position'),
                hsFilters: layer.get('hsFilters'),
                uid: utils.generateUuid(),
                idString() {
                    return 'layer' + (this.coded_path || '') + (this.uid || '')
                }
            };

            WMST.setupTimeLayerIfNeeded(new_layer);

            if (layer.get('base') != true) {
                populateFolders(layer);
                if (layer.get('legends')) {
                    new_layer.legends = layer.get('legends');
                }
                me.data.layers.push(new_layer);
            } else {
                new_layer.active = layer.getVisible();
                me.data.baselayers.push(new_layer);
            };

            if (layer.getVisible() && layer.get("base"))
                me.data.baselayer = layerUtils.getLayerTitle(layer);
            me.updateLayerOrder();
            $rootScope.$broadcast('layermanager.layer_added', new_layer);
            $rootScope.$broadcast('layermanager.updated', layer);
            $rootScope.$broadcast('compositions.composition_edited');
        };

        function checkLayerHealth(layer) {
            if (me.isWms(layer)) {
                var src = layer.getSource();
                if (angular.isUndefined(src.getParams().LAYERS)) {
                    console.warn('Layer', layer, 'is missing LAYERS parameter');
                }
            }
        }

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
         * @function getLayerByTitle
         * @memberOf hs.layermanager.service
         * @param {Object} Hslayers layer
         */
        function getLayerByTitle(title) {
            var tmp;
            angular.forEach(me.data.layers, function (layer) {
                if (layer.title == title) tmp = layer;
            })
            return tmp;
        }

        me.getLayerByTitle = getLayerByTitle;

        /**
         * @ngdoc method
         * @name hs.layermanager.service#getLayerDescriptorForOlLayer
         * @private
         * @param {Ol.layer} Layer to get layer title
         * @returns {Object} Layer container which is used in layer-list directive
         * @description Get layer container object for OL layer
         */
        me.getLayerDescriptorForOlLayer = function (layer) {
            let tmp = me.data.layers.filter(l => l.layer == layer)
            if (tmp.length > 0) return tmp[0]
            return;
        }

        /**
         * @ngdoc method
         * @name hs.layermanager.service#populateFolders
         * @private
         * @param {Object} lyr Layer to add into folder structure
         * @description Place layer into layer manager folder structure based on path property hsl-path of layer
         */
        function populateFolders(lyr) {
            if (angular.isDefined(lyr.get('path')) && lyr.get('path') !== 'undefined') {
                var path = lyr.get('path') || '';
                var parts = path.split('/');
                var curfolder = me.data.folders;
                for (var i = 0; i < parts.length; i++) {
                    var found = null;
                    angular.forEach(curfolder.sub_folders, function (folder) {
                        if (folder.name == parts[i])
                            found = folder;
                    })
                    if (found == null) {
                        //TODO: Need to describe how hsl_path works here
                        var new_folder = {
                            sub_folders: [],
                            indent: i,
                            layers: [],
                            name: parts[i],
                            hsl_path: curfolder.hsl_path + (curfolder.hsl_path != '' ? '/' : '') + parts[i],
                            coded_path: curfolder.coded_path + curfolder.sub_folders.length + '-'
                        };
                        curfolder.sub_folders.push(new_folder);
                        curfolder = new_folder;
                    } else {
                        curfolder = found;
                    }
                }
                lyr.coded_path = curfolder.coded_path;
                curfolder.layers.push(lyr);
                if (me.data.folders.layers.indexOf(lyr) > -1) me.data.folders.layers.splice(me.data.folders.layers.indexOf(lyr), 1);
            } else {
                me.data.folders.layers.push(lyr);
            }
        }

        /**
         * @ngdoc method
         * @name hs.layermanager.service#cleanFolders
         * @private
         * @param {ol.Layer} lyr Layer to remove from layer folder
         * @description Remove layer from layer folder structure a clean empty folder
         */
        function cleanFolders(lyr) {
            if (angular.isDefined(lyr.get('path')) && lyr.get('path') !== 'undefined') {
                var path = lyr.get('path');
                var parts = path.split('/');
                var curfolder = me.data.folders;
                for (var i = 0; i < parts.length; i++) {
                    angular.forEach(curfolder.sub_folders, function (folder) {
                        if (folder.name == parts[i])
                            curfolder = folder;
                    })
                }

                curfolder.layers.splice(curfolder.layers.indexOf(lyr), 1);
                for (var i = parts.length; i > 0; i--) {
                    if (curfolder.layers.length == 0 && curfolder.sub_folders.length == 0) {
                        var newfolder = me.data.folders;
                        if (i > 1) {
                            for (var j = 0; j < i - 1; j++) {
                                angular.forEach(newfolder.sub_folders, function (folder) {
                                    if (folder.name == parts[j])
                                        newfolder = folder;
                                })
                            }
                        }
                        var ixToRemove = newfolder.sub_folders.indexOf(curfolder);
                        if (ixToRemove > -1) newfolder.sub_folders.splice(ixToRemove, 1);
                        curfolder = newfolder;
                    } else break;
                }
            } else {
                var ixToRemove = me.data.folders.layers.indexOf(lyr);
                if (ixToRemove > -1) me.data.folders.layers.splice(ixToRemove, 1);
            }
        }

        /**
         * (PRIVATE)
         * @function layerRemoved
         * @memberOf hs.layermanager.service
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
        };

        /**
         * (PRIVATE)
         * @function boxLayersInit
         * @memberOf hs.layermanager.service
         * @description Initilaze box layers and their starting active state
         */
        function boxLayersInit() {
            if (angular.isDefined(config.box_layers)) {
                me.data.box_layers = config.box_layers;
                angular.forEach(me.data.box_layers, function (box) {
                    var visible = false;
                    var baseVisible = false;
                    angular.forEach(box.get('layers'), function (layer) {
                        if (layer.get('visible') == true && layer.get('base') == true) baseVisible = true;
                        else if (layer.get('visible') == true) visible = true;
                    });
                    box.set('active', baseVisible ? baseVisible : visible);
                });
            }
        }

        /**
         * @function changeLayerVisibility
         * @memberOf hs.layermanager.service
         * @description Change visibility of selected layer. If layer has exclusive setting, other layers from same group may be turned unvisible
         * @param {Boolean} visibility Visibility layer should have
         * @param {Object} layer Selected layer - wrapped layer object (layer.layer expected)
         */
        me.changeLayerVisibility = function (visibility, layer) {
            layer.layer.setVisible(visibility);
            layer.visible = visibility;
            //Set the other layers in the same folder invisible
            if (visibility && layer.layer.get('exclusive') == true) {
                angular.forEach(me.data.layers, function (other_layer) {
                    if (other_layer.layer.get('path') == layer.layer.get('path') && other_layer != layer) {
                        other_layer.layer.setVisible(false);
                        other_layer.visible = false;
                    }
                })
            }
        }
        /**
         * @function changeBaseLayerVisibility
         * @memberOf hs.layermanager.service
         * @description Change visibility (on/off) of baselayers, only one baselayer may be visible
         * @param {object} $event Info about the event change visibility event, used if visibility of only one layer is changed
         * @param {object} layer Selected layer - wrapped layer object (layer.layer expected)
         */
        me.changeBaseLayerVisibility = function ($event, layer) {
            if (angular.isUndefined(layer) || angular.isDefined(layer.layer)) {
                if (me.data.baselayersVisible == true) {
                    if ($event) {
                        for (var i = 0; i < me.data.baselayers.length; i++) {
                            if (me.data.baselayers[i].layer) {
                                me.data.baselayers[i].layer.setVisible(false);
                                me.data.baselayers[i].visible = false;
                                me.data.baselayers[i].active = false;
                            }
                        }
                        for (var i = 0; i < me.data.baselayers.length; i++) {
                            if (me.data.baselayers[i].layer && me.data.baselayers[i] == layer) {
                                me.data.baselayers[i].layer.setVisible(true);
                                me.data.baselayers[i].visible = true;
                                me.data.baselayers[i].active = true;
                                break;
                            }
                        }
                    } else {
                        me.data.baselayersVisible = false;
                        for (var i = 0; i < me.data.baselayers.length; i++) {
                            me.data.baselayers[i].layer.setVisible(false);
                        }
                    }
                } else {
                    if ($event) {
                        layer.active = true;
                        for (var i = 0; i < me.data.baselayers.length; i++) {
                            if (me.data.baselayers[i] != layer) {
                                me.data.baselayers[i].active = false;
                            } else {
                                me.data.baselayers[i].layer.setVisible(true);
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
                    if (angular.isDefined(me.data.baselayers[i].type) && me.data.baselayers[i].type == 'terrain')
                        me.data.baselayers[i].active = me.data.baselayers[i].visible = (me.data.baselayers[i] == layer);
                }
            }
            $rootScope.$broadcast('layermanager.base_layer_visible_changed', layer);
        }

        /**
         * @function changeTerrainLayerVisibility
         * @memberOf hs.layermanager.service
         * @description Change visibility (on/off) of baselayers, only one baselayer may be visible
         * @param {object} $event Info about the event change visibility event, used if visibility of only one layer is changed
         * @param {object} layer Selected layer - wrapped layer object (layer.layer expected)
         */
        me.changeTerrainLayerVisibility = function ($event, layer) {
            for (var i = 0; i < me.data.terrainlayers.length; i++) {
                if (angular.isDefined(me.data.terrainlayers[i].type) && me.data.terrainlayers[i].type == 'terrain')
                    me.data.terrainlayers[i].active = me.data.terrainlayers[i].visible = (me.data.terrainlayers[i] == layer);
            }
            $rootScope.$broadcast('layermanager.base_layer_visible_changed', layer);
        }

        /**
         * Update "position" property of layers, so layers could be correctly ordered in GUI
         * @function updateLayerOrder
         * @memberOf hs.layermanager.service
         */
        me.updateLayerOrder = function () {
            angular.forEach(me.data.layers, function (my_layer) {
                my_layer.layer.set('position', getMyLayerPosition(my_layer.layer));
                my_layer.position = my_layer.layer.get('position');
            })
        }
        /**
         * (PRIVATE) Get position of selected layer in map layer order
         * @function getMyLayerPosition
         * @memberOf hs.layermanager.service
         * @param {Ol.layer} layer Selected layer
         */
        function getMyLayerPosition(layer) {
            var pos = null;
            for (var i = 0; i < OlMap.map.getLayers().getLength(); i++) {
                if (OlMap.map.getLayers().item(i) == layer) {
                    pos = i;
                    break;
                }
            }
            return pos;
        }

        /**
             * (PRIVATE)
             * @function removeAllLayers
             * @memberOf hs.layermanager.service
             * @description Remove all layers from map
             */
        me.removeAllLayers = function () {
            var to_be_removed = [];
            OlMap.map.getLayers().forEach(function (lyr) {
                if (angular.isUndefined(lyr.get('removable')) || lyr.get('removable') == true)
                    if (angular.isUndefined(lyr.get('base')) || lyr.get('base') == false)
                        if (angular.isUndefined(lyr.get('show_in_manager')) || lyr.get('show_in_manager') == true)
                            to_be_removed.push(lyr);
            });
            while (to_be_removed.length > 0) {
                OlMap.map.removeLayer(to_be_removed.shift());
            }
        }

        /**
         * @function activateTheme
         * @memberOf hs.layermanager.service
         * @description Show all layers of particular layer group (when groups are defined)
         * @param {ol.layer.Group} theme Group layer to activate
         */
        me.activateTheme = function (theme) {
            var switchOn = true;
            if (theme.get('active') == true) switchOn = false;
            theme.set('active', switchOn);
            var baseSwitched = false;
            theme.setVisible(switchOn);
            angular.forEach(theme.get('layers'), function (layer) {
                if (layer.get('base') == true && !baseSwitched) {
                    me.changeBaseLayerVisibility();
                    baseSwitched = true;
                } else if (layer.get('base') == true) return;
                else {
                    layer.setVisible(switchOn);
                }
            });
        }

        /**
         * @function loadingEvents
         * @memberOf hs.layermanager.service
         * @description Create events for checking if layer is being loaded or is loaded for ol.layer.Image or ol.layer.Tile
         * @param {ol.layer} layer Layer which is being added
         */
        function loadingEvents(layer) {
            var source = layer.getSource()
            source.loadCounter = 0;
            source.loadTotal = 0;
            source.loadError = 0;
            source.loaded = true;
            if (utils.instOf(layer, ImageLayer)) {
                source.on('imageloadstart', function (event) {
                    source.loaded = false;
                    source.loadCounter += 1;
                    $rootScope.$broadcast('layermanager.layer_loading', layer);
                    if (!$rootScope.$$phase) $rootScope.$digest();
                });
                source.on('imageloadend', function (event) {
                    source.loaded = true;
                    source.loadCounter -= 1;
                    $rootScope.$broadcast('layermanager.layer_loaded', layer);
                    if (!$rootScope.$$phase) $rootScope.$digest();
                });
                source.on('imageloaderror', function (event) {
                    source.loaded = true;
                    source.error = true;
                    $rootScope.$broadcast('layermanager.layer_loaded', layer);
                    if (!$rootScope.$$phase) $rootScope.$digest();
                });
            } else if (utils.instOf(layer, Tile)) {
                source.on('tileloadstart', function (event) {
                    source.loadCounter += 1;
                    source.loadTotal += 1;
                    if (source.loaded == true) {
                        source.loaded = false;
                        source.set('loaded', false);
                        $rootScope.$broadcast('layermanager.layer_loading', layer);
                        if (!$rootScope.$$phase) $rootScope.$digest();
                    }

                });
                source.on('tileloadend', function (event) {
                    source.loadCounter -= 1;
                    if (source.loadCounter == 0) {
                        source.loaded = true;
                        source.set('loaded', true);
                        $rootScope.$broadcast('layermanager.layer_loaded', layer);
                        if (!$rootScope.$$phase) $rootScope.$digest();
                    }
                });
                source.on('tileloaderror', function (event) {
                    source.loadCounter -= 1;
                    source.loadError += 1;
                    if (source.loadError == source.loadTotal) {
                        source.error = true;
                    }
                    if (source.loadCounter == 0) {
                        source.loaded = true;
                        source.set('loaded', true);
                        $rootScope.$broadcast('layermanager.layer_loaded', layer);
                        if (!$rootScope.$$phase) $rootScope.$digest();
                    }
                });
            }
        }

        me.isWms = function (layer) {
            return (utils.instOf(layer.getSource(), TileWMS) || utils.instOf(layer.getSource(), ImageWMS));
        }

        /**
         * @function isLayerInResolutionInterval
         * @memberOf hs.layermanager.service
         * @param {Ol.layer} lyr Selected layer
         * @description Test if layer (WMS) resolution is within map resolution interval
         */
        me.isLayerInResolutionInterval = function (lyr) {
            var src = lyr.getSource();
            if (me.isWms(lyr)) {
                var view = OlMap.map.getView();
                var resolution = view.getResolution();
                var units = map.getView().getProjection().getUnits();
                var dpi = 25.4 / 0.28;
                var mpu = METERS_PER_UNIT[units];
                var cur_res = resolution * mpu * 39.37 * dpi;
                return (lyr.getMinResolution() >= cur_res || cur_res >= lyr.getMaxResolution());
            } else {
                var cur_res = OlMap.map.getView().getResolution();
                return lyr.getMinResolution() >= cur_res && cur_res <= lyr.getMaxResolution();

            }
        }

        var timer;

        me.fillMetadata = function (layer) {
            const url = layerUtils.getURL(layer.layer);
            let metadata = {
                metainfo: { "OnlineResource": layer.layer.get("Metadata") }
            };
            //WMS
            if (layerUtils.isLayerWMS(layer.layer)) {
                WMSgetCapabilitiesService.requestGetCapabilities(url)
                    .then(function (capabilities_xml) {
                        let parser = new WMSCapabilities();
                        let caps = parser.read(capabilities_xml);
                        let layers = caps.Capability.Layer.Layer;
                        let service = {
                            "0": caps.Service
                        };

                        let layer_name = (layer.layer.getSource().getParams().LAYERS)

                        angular.forEach(layers, function (service_layer) {
                            if (layer_name === service_layer.Name) {
                                layer.layer.setProperties(service_layer)
                                if (layer.layer.get("Copyright")) {
                                    layer.layer.set("Attribution", { "OnlineResource": layer.layer.get("Copyright") });
                                }
                                if (layer.layer.get("Metadata")) {
                                    layer.layer.set("MetadataURL", metadata);
                                    if (!$rootScope.$$phase) $rootScope.$digest();
                                    return layer
                                }
                                if (service_layer.MetadataURL == false) {
                                    layer.layer.set("MetadataURL", service)
                                }
                            };
                        });
                        if (!$rootScope.$$phase) $rootScope.$digest();

                    })
                    .catch(function (e) {
                        console.log('GetCapabilities call invalid', e);
                    })


            }
            //WMTS
            else if (layerUtils.isLayerWMTS(layer.layer)) {
                WMTSgetCapabilitiesService.requestGetCapabilities(url)
                    .then(function (capabilities_xml) {
                        let parser = new WMTSCapabilities();
                        let caps = parser.read(capabilities_xml.data);
                        layer.layer.setProperties(caps);
                        if (layer.layer.get("Copyright")) {
                            layer.layer.set("Attribution", { "OnlineResource": layer.layer.get("Copyright") });
                        }
                        else {
                            layer.layer.set("Attribution", { "OnlineResource": caps.ServiceProvider.ProviderSite });
                        }
                        if (layer.layer.get("Metadata")) {
                            layer.layer.set("MetadataURL", metadata);
                        }
                        if (!$rootScope.$$phase) $rootScope.$digest();

                    })
                    .catch(error => console.log(error));


            }
            //WFS and vector
            else if (layerUtils.isLayerVectorLayer(layer.layer)) {
                if (url) {

                    WFSgetCapabilitiesService.requestGetCapabilities(url)
                        .then(function (capabilities_xml) {
                            let parser = new DOMParser();
                            let caps = parser.parseFromString(capabilities_xml.data, "application/xml");
                            let el = caps.getElementsByTagNameNS("*", "ProviderSite");
                            if (layer.layer.get("Copyright")) {
                                layer.layer.set("Attribution", { "OnlineResource": layer.layer.get("Copyright") });
                            }
                            else {
                                layer.layer.set("Attribution", { "OnlineResource": el[0].getAttribute("xlink:href") });
                            }
                            if (!$rootScope.$$phase) $rootScope.$digest();


                        })
                        .catch(error => console.log(error.message));
                }
            }
        };

        /**
         * (PRIVATE)
         * @function init
         * @memberOf hs.layermanager.service
         * @description Initialization of needed controllers, run when map object is available
         */
        function init() {
            map = OlMap.map;
            OlMap.map.getLayers().forEach(function (lyr) {
                layerAdded({
                    element: lyr
                });
            });

            boxLayersInit();

            map.getView().on('change:resolution', function (e) {
                if (timer != null) clearTimeout(timer);
                timer = setTimeout(function () {
                    for (var i = 0; i < me.data.layers.length; i++) {
                        me.data.layers[i].grayed = me.isLayerInResolutionInterval(me.data.layers[i].layer);
                    }
                    if (!$rootScope.$$phase) $rootScope.$digest();
                }, 500);
            });

            map.getLayers().on("add", layerAdded);
            map.getLayers().on("remove", layerRemoved);
        }

        OlMap.loaded().then(init);

        return me;
    }
]