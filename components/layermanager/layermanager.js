/**
 * @namespace hs.layermanager
 * @memberOf hs
 */
define(['angular', 'app', 'map', 'ol', 'utils', 'ows.wms', 'dragdroplists', 'status_creator'], function (angular, app, map, ol) {
    angular.module('hs.layermanager', ['hs.map', 'hs.utils', 'hs.ows.wms', 'dndLists', 'hs.status_creator'])
        /**
         * @name hs.layermanager.directive
         * @ngdoc directive
         * @memberOf hs.layermanager
         * @description Display layer manager panel in map. Contain filter, baselayers, overlay container and settings pane for active layer.
         */
        .directive('hs.layermanager.directive', function () {
            return {
                templateUrl: hsl_path + 'components/layermanager/partials/layermanager.html?bust=' + gitsha
            };
        })
        /**
         * @memberOf hs.layermanager
         * @ngdoc directive
         * @name hs.layermanager.layerlistDirective
         * @description Directive for displaying layerlist. Contains layers ordering logic.
         */
        .directive('hs.layermanager.layerlistDirective', ['$compile', function ($compile) {
            return {
                templateUrl: hsl_path + 'components/layermanager/partials/layerlist.html?bust=' + gitsha,
                compile: function compile(element) {
                    var contents = element.contents().remove();
                    var contentsLinker;

                    return function (scope, iElement) {

                        scope.layer_titles = [];

                        if (scope.value == null) {
                            scope.obj = scope.data.folders;
                        } else {
                            scope.obj = scope.value;
                        }
                        /**
                         * (PRIVATE) This function will be called whenever map layers change and folder contents need to be updated
                         * @function filterLayers
                         * @memberOf hs.layermanager.layerlistDirective
                         */
                        function filterLayers() {
                            var tmp = [];

                            angular.forEach(scope.data.layers, function (layer) {
                                if (layer.layer.get('path') == scope.obj.hsl_path || ((angular.isUndefined(layer.layer.get('path')) || layer.layer.get('path') == '') && scope.obj.hsl_path == '')) {
                                    tmp.push(layer);
                                }
                            })
                            return tmp;
                        }

                        scope.filtered_layers = filterLayers();
                        /**
                         * Dragdroplist cant handle complex OL objects, so we are creating a compact list of layer titles only
                         * @function generateLayerTitlesArray
                         * @memberOf hs.layermanager.layerlistDirective
                         */
                        scope.generateLayerTitlesArray = function () {
                            scope.layer_titles = [];
                            for (var i = 0; i < scope.filtered_layers.length; i++) {
                                scope.layer_titles.push(scope.filtered_layers[i].title);
                            }

                        }

                        scope.$on('layermanager.updated', sortLayersByPosition);
                        /**
                         * (PRIVATE) Sort layers by computed position
                         * @function sortLayersByPosition
                         * @memberOf hs.layermanager.layerlistDirective
                         */
                        function sortLayersByPosition() {
                            scope.filtered_layers = filterLayers();
                            scope.filtered_layers.sort(function (a, b) {
                                return b.layer.get('position') - a.layer.get('position')
                            });
                            scope.generateLayerTitlesArray();
                        }

                        sortLayersByPosition();

                        if (angular.isUndefined(contentsLinker)) {
                            contentsLinker = $compile(contents);
                        }

                        contentsLinker(scope, function (clonedElement) {
                            iElement.append(clonedElement);
                        });

                        /**
                         * Callback for dragged event so event can be injected with correct layer titles layer 
                         * @function dragged
                         * @memberOf hs.layermanager.layerlistDirective
                         */
                        scope.dragged = function (event, index, item, type, external) {
                            var titles = scope.layer_titles;
                            scope.draggedCont(event, index, item, type, external, titles);
                        }
                    };
                }
            };
                }])
        /**
         * @name hs.layermanager.removeAllDialogDirective
         * @ngdoc directive
         * @memberOf hs.layermanager
         * @description Display warning dialog about removing all layers
         */
        .directive('hs.layermanager.removeAllDialogDirective', function () {
            return {
                templateUrl: hsl_path + 'components/layermanager/partials/dialog_removeall.html?bust=' + gitsha,
                link: function (scope, element, attrs) {
                    $('#hs-remove-all-dialog').modal('show');
                }
            };
        })
        /**
         * @ngdoc directive
         * @name hs.layermanager.folderDirective
         * @memberOf hs.layermanager
         * @description Directive for displaying folder. Used recursively
         */
        .directive('hs.layermanager.folderDirective', ['$compile', function ($compile) {
            return {
                templateUrl: hsl_path + 'components/layermanager/partials/folder.html?bust=' + gitsha,
                compile: function compile(element) {
                    var contents = element.contents().remove();
                    var contentsLinker;

                    return function (scope, iElement) {
                        scope.folderVisible = function (obj) {
                            return obj.sub_folders.length > 0;
                        }

                        if (scope.value == null) {
                            scope.obj = "-";
                        } else {
                            scope.obj = scope.value;
                        }

                        if (angular.isUndefined(contentsLinker)) {
                            contentsLinker = $compile(contents);
                        }

                        contentsLinker(scope, function (clonedElement) {
                            iElement.append(clonedElement);
                        });
                    };
                }
            };
            }])
    /**
     * @memberOf hs.layermanager
     * @ngdoc service
     * @name hs.layermanager.service
     * @description Service for core layers management. Maintain layer management structures and connect layer manager with map.Automatically update manager when layer is added or removed from map.
     */
    .service("hs.layermanager.service", ['$rootScope', 'hs.map.service', 'Core', 'hs.utils.service', 'config', 'hs.layermanager.WMSTservice',
                function ($rootScope, OlMap, Core, utils, config, WMST) {
            var me = {};

            me.data = {};

            me.data.folders = {
                hsl_path: '',
                coded_path: '0-',
                layers: [],
                sub_folders: [],
                indent: 0
            };

            me.data.layers = [];
            me.data.baselayers = [];
            me.data.baselayersVisibile = true;

            var map;

            /**
             * (PRIVATE) Prepare URL for GetLegendGraphic WMS request
             * @function getLegendUrl
             * @memberOf hs.layermanager.service
             * @param {String} source_url Url of WMS server
             * @param {String} layer_name Name of layer to get graphic
             * @returns {String} Full Url for request
             */
            function getLegendUrl(source_url, layer_name) {
                if (source_url.indexOf('proxy4ows') > -1) {
                    var params = utils.getParamsFromUrl(source_url);
                    source_url = params.OWSURL;
                }
                source_url += (source_url.indexOf('?') > 0 ? '' : '?') + "&version=1.3.0&service=WMS&request=GetLegendGraphic&sld_version=1.1.0&layer=" + layer_name + "&format=image%2Fpng";
                return source_url;
            }

            /**
             * (PRIVATE)
             * @function layerAdded
             * @memberOf hs.layermanager.service
             * @description Callback function for layer adding for layers shown in manager. Edit layer to enable addition to layer manager .
             * @param {ol.CollectionEvent} e - Events emitted by ol.Collection instances are instances of this type.
             */
            function layerAdded(e) {
                var layer = e.element;
                if (layer.get('show_in_manager') != null && layer.get('show_in_manager') == false) return;
                WMST.layerIsWmsT(layer);
                loadingEvents(layer);
                var sub_layers;
                if (layer.getSource().getParams) { // Legend only for wms layers with params
                    sub_layers = layer.getSource().getParams().LAYERS.split(",");
                    for (var i = 0; i < sub_layers.length; i++) {
                        if (layer.getSource().getUrls) //Multi tile
                            sub_layers[i] = getLegendUrl(layer.getSource().getUrls()[0], sub_layers[i]);
                        if (layer.getSource().getUrl) //Single tile
                            sub_layers[i] = getLegendUrl(layer.getSource().getUrl(), sub_layers[i]);
                    }
                }
                //if (layer.get('base') != true) {
                layer.on('change:visible', function (e) {
                        if (layer.get('base') != true) {
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
                        if (!$rootScope.$$phase) $rootScope.$digest();
                    })
                    //}

                if (typeof layer.get('position') == 'undefined') layer.set('position', getMyLayerPosition(layer));
                if (console) console.log(layer.get('title'), layer.getVisible());
                var new_layer = {
                    title: getLayerTitle(layer),
                    layer: layer,
                    grayed: me.isLayerInResolutionInterval(layer),
                    visible: layer.getVisible()
                };

                if (WMST.layerIsWmsT(new_layer)) {
                    var dimensions_time = new_layer.layer.get('dimensions_time') || new_layer.layer.dimensions_time;
                    var time;
                    if (angular.isDefined(new_layer.layer.get('dimensions').time.default)) {
                        time = new Date(new_layer.layer.get('dimensions').time.default);
                    } else {
                        time = new Date(dimensions_time.timeInterval[0]);
                    }
                    angular.extend(new_layer, {
                        time_step: dimensions_time.timeStep,
                        time_unit: dimensions_time.timeUnit,
                        date_format: WMST.getDateFormatForTimeSlider(dimensions_time.timeUnit),
                        date_from: new Date(dimensions_time.timeInterval[0]),
                        date_till: new Date(dimensions_time.timeInterval[1]),
                        time: time,
                        date_increment: time.getTime()
                    });
                    WMST.setLayerTimeSliderIntervals(new_layer, dimensions_time);
                    WMST.setLayerTime(new_layer);
                }
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

                if (layer.getVisible() && layer.get("base")) me.data.baselayer = getLayerTitle(layer);
                me.updateLayerOrder();
                $rootScope.$broadcast('layermanager.updated', layer);
                $rootScope.$broadcast('compositions.composition_edited');
            };
            
            
            /**
             * (PRIVATE) Get layer by its title
             * @function getLayerByTitle
             * @memberOf hs.layermanager.service
             * @param {Object} Hslayers layer
             */
            function getLayerByTitle(title) {
                var tmp;
                angular.forEach(me.data.layers, function(layer){
                    if(layer.title == title) tmp = layer;
                })
                return tmp;
            }
            
            me.getLayerByTitle = getLayerByTitle;


            /**
             * (PRIVATE) Get title of selected layer
             * @function getLayerTitle
             * @memberOf hs.layermanager.service
             * @param {Ol.layer} layer Selected layer
             */
            function getLayerTitle(layer) {
                if (angular.isDefined(layer.get('title'))) {
                    return layer.get('title').replace(/&#47;/g, '/');
                } else {
                    return 'Void';
                }
            }

            /**
             * (PRIVATE)
             * @function populateFolders
             * @memberOf hs.layermanager.service
             * @description Place layer into layer manager folder structure based on path property of layer
             * @param {ol.Layer} lyr Layer to add into layer folder
             */
            function populateFolders(lyr) {
                if (angular.isDefined(lyr.get('path')) && lyr.get('path') !== 'undefined') {
                    var path = lyr.get('path');
                    var parts = path.split('/');
                    var curfolder = me.data.folders;
                    for (var i = 0; i < parts.length; i++) {
                        var found = null;
                        angular.forEach(curfolder.sub_folders, function (folder) {
                            if (folder.name == parts[i])
                                found = folder;
                        })
                        if (found == null) {
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
                    curfolder.layers.push(lyr);
                    if (me.data.folders.layers.indexOf(lyr) > -1) me.data.folders.layers.splice(me.data.folders.layers.indexOf(lyr), 1);
                } else {
                    me.data.folders.layers.push(lyr);
                }
            }

            /**
             * (PRIVATE)
             * @function cleanFolders
             * @memberOf hs.layermanager.service
             * @description Remove layer from layer folder a clean empty folders
             * @param {ol.Layer} lyr Layer to remove from layer folder
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
                            newfolder.sub_folders.splice(newfolder.sub_folders.indexOf(curfolder), 1);
                            curfolder = newfolder;
                        } else break;
                    }
                } else {
                    me.data.folders.layers.splice(me.data.folders.layers.indexOf(lyr), 1);
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
                if (me.data.baselayersVisible == true) {
                    if ($event) {
                        for (var i = 0; i < me.data.baselayers.length; i++) {
                            me.data.baselayers[i].layer.setVisible(false);
                            me.data.baselayers[i].visible = false;
                            me.data.baselayers[i].active = false;
                        }
                        for (var i = 0; i < me.data.baselayers.length; i++) {
                            if (me.data.baselayers[i] == layer) {
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
            }

            /**
             * Update "position" property of layers, so layers could be correctly ordered in GUI
             * @function updateLayerOrder
             * @memberOf hs.layermanager.service            
             */
            me.updateLayerOrder = function () {
                angular.forEach(me.data.layers, function (my_layer) {
                    my_layer.layer.set('position', getMyLayerPosition(my_layer.layer));
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
                if (layer instanceof ol.layer.Image) {
                    source.on('imageloadstart', function (event) {
                        source.loaded = false;
                        $rootScope.$broadcast('layermanager.layer_loading', layer);
                        if (!$rootScope.$$phase) $rootScope.$digest();
                    });
                    source.on('imageloadend', function (event) {
                        source.loaded = true;
                        $rootScope.$broadcast('layermanager.layer_loaded', layer);
                        if (!$rootScope.$$phase) $rootScope.$digest();
                    });
                    source.on('imageloaderror', function (event) {
                        source.loaded = true;
                        source.error = true;
                        $rootScope.$broadcast('layermanager.layer_loaded', layer);
                        if (!$rootScope.$$phase) $rootScope.$digest();
                    });
                } else if (layer instanceof ol.layer.Tile) {
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

            /**
             * @function isLayerInResolutionInterval
             * @memberOf hs.layermanager.service
             * @param {Ol.layer} lyr Selected layer
             * @description Test if layer (WMS) resolution is within map interval 
             */
            me.isLayerInResolutionInterval = function (lyr) {
                var src = lyr.getSource();
                if (src instanceof ol.source.ImageWMS || src instanceof ol.source.TileWMS) {
                    var view = OlMap.map.getView();
                    var resolution = view.getResolution();
                    var units = map.getView().getProjection().getUnits();
                    var dpi = 25.4 / 0.28;
                    var mpu = ol.proj.METERS_PER_UNIT[units];
                    var cur_res = resolution * mpu * 39.37 * dpi;
                    return (lyr.getMinResolution() >= cur_res || cur_res >= lyr.getMaxResolution());
                } else {
                    var cur_res = OlMap.map.getView().getResolution();
                    return lyr.getMinResolution() >= cur_res && cur_res <= lyr.getMaxResolution();

                }
            }

            var timer;

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

                OlMap.map.getView().on('change:resolution', function (e) {
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

            if (angular.isDefined(OlMap.map)) {
                init();
            }
            else {
                $rootScope.$on('map.loaded', function () {
                    init();
                });
            }

            return me;
        }
    ])

    /**
     * @memberOf hs.layermanager
     * @ngdoc service
     * @name hs.layermanager.WMSTservice
     * @description Service for management of time (WMS) layers
     */
    .service("hs.layermanager.WMSTservice", ['$rootScope', 'hs.map.service', 'Core', 'hs.utils.service', 'config',
                function ($rootScope, OlMap, Core, utils, config) {
            var me = {};

            /**
             * Get date format of time data based on time unit property
             * @function getDateFormatForTimeSlider
             * @memberOf hs.layermanager.WMSTservice
             * @param {String} time_unit
             */
            me.getDateFormatForTimeSlider = function (time_unit) {
                switch (time_unit) {
                case 'FullYear':
                case 'Month':
                case 'Day':
                    return date_format = 'dd-MM-yyyy';;
                    break
                default:
                    return 'dd-MM-yyyy HH:mm';;
                }
            }

            /**
             * Set time intervals for WMS-T (WMS with time support)
             * @function setLayerTimeSliderIntervals
             * @memberOf hs.layermanager.WMSTservice
             * @param {Object} new_layer Layer to set time intervals
             * @param {Object} metadata Time dimension metadata for layer
             */
            me.setLayerTimeSliderIntervals = function (new_layer, metadata) {
                switch (new_layer.time_unit) {
                case 'FullYear':
                    var d = new Date(metadata.timeInterval[0]);
                    new_layer.min_time = d.getFullYear();
                    d = new Date(metadata.timeInterval[1]);
                    new_layer.max_time = d.getFullYear();
                    break;
                case 'Month':
                    var d = new Date(metadata.timeInterval[0]);
                    new_layer.min_time = 0;
                    var d2 = new Date(metadata.timeInterval[1]);
                    new_layer.max_time = d.monthDiff(d2);
                    break;
                default:
                    new_layer.min_time = new Date(metadata.timeInterval[0]).getTime();
                    new_layer.max_time = new Date(metadata.timeInterval[1]).getTime();
                }
            }

            /**
             * @function parseInterval
             * @memberOf hs.layermanager.WMSTservice
             * @param {String} interval Interval time string
             * @description Parse interval string to get interval in Date format
             */
            function parseInterval(interval) {
                var dateComponent;
                var timeComponent;

                var year;
                var month;
                var day;
                var week;
                var hour;
                var minute;
                var second;

                year = month = week = day = hour = minute = second = 0;

                var indexOfT = interval.search("T");

                if (indexOfT > -1) {
                    dateComponent = interval.substring(1, indexOfT);
                    timeComponent = interval.substring(indexOfT + 1);
                } else {
                    dateComponent = interval.substring(1);
                }

                // parse date
                if (dateComponent) {
                    var indexOfY = (dateComponent.search("Y") > -1 ? dateComponent.search("Y") : undefined);
                    var indexOfM = (dateComponent.search("M") > -1 ? dateComponent.search("M") : undefined);
                    var indexOfW = (dateComponent.search("W") > -1 ? dateComponent.search("W") : undefined);
                    var indexOfD = (dateComponent.search("D") > -1 ? dateComponent.search("D") : undefined);

                    if (indexOfY !== undefined) {
                        year = parseFloat(dateComponent.substring(0, indexOfY));
                    }
                    if (indexOfM !== undefined) {
                        month = parseFloat(dateComponent.substring((indexOfY || -1) + 1, indexOfM));
                    }
                    if (indexOfD !== undefined) {
                        day = parseFloat(dateComponent.substring((indexOfM || indexOfY || -1) + 1, indexOfD));
                    }
                }

                // parse time
                if (timeComponent) {
                    var indexOfH = (timeComponent.search("H") > -1 ? timeComponent.search("H") : undefined);
                    var indexOfm = (timeComponent.search("M") > -1 ? timeComponent.search("M") : undefined);
                    var indexOfS = (timeComponent.search("S") > -1 ? timeComponent.search("S") : undefined);

                    if (indexOfH !== undefined) {
                        hour = parseFloat(timeComponent.substring(0, indexOfH));
                    }
                    if (indexOfm !== undefined) {
                        minute = parseFloat(timeComponent.substring((indexOfH || -1) + 1, indexOfm));
                    }
                    if (indexOfS !== undefined) {
                        second = parseFloat(timeComponent.substring((indexOfm || indexOfH || -1) + 1, indexOfS));
                    }
                }
                // year, month, day, hours, minutes, seconds, milliseconds)
                var zero = new Date(0, 0, 0, 0, 0, 0, 0);
                var step = new Date(year, month, day, hour, minute, second, 0);
                return step - zero;
            }
            /**
             * @function layerIsWmsT
             * @memberOf hs.layermanager.WMSTservice
             * @param {Ol.collection} layer_container Container object of layer (layer_container.layer expected)
             * @return {Boolean} True for WMS layer with time support
             * Test if WMS layer have time support (WMS-T). WMS layer has to have dimensions_time or dimension property, function converts dimension to dimensions_time
             */
            me.layerIsWmsT = function (layer_container) {
                if (angular.isUndefined(layer_container) || layer_container == null) return false;
                var layer = layer_container.layer;
                if (angular.isUndefined(layer)) return false;
                if (layer.get('dimensions_time') && angular.isArray(layer.get('dimensions_time').timeInterval)) return true;
                if (layer.get('dimensions') && angular.isObject(layer.get('dimensions').time)) {
                    var metadata = {};
                    var value = layer.get('dimensions').time.values;
                    if (angular.isArray(value)) value = value[0];
                    value = value.replace(/\s*/g, "");

                    if (value.search("/") > -1) {
                        var interval = value.split("/").map(function (d) {
                            if (d.search("Z") > -1) {
                                d = d.replace("Z", "00:00");
                            }
                            return d;
                        });

                        if (interval.length == 3) {
                            metadata.timeStep = parseInterval(interval[2]);
                            interval.pop();
                        }

                        metadata.timeInterval = interval;
                    }
                    angular.extend(layer, {
                        dimensions_time: metadata
                    })
                    return true;
                }
                return false;
            }

            /**
             * @function setLayerTime
             * @memberOf hs.layermanager.WMSTservice
             * @param {object} currentlayer Selected layer 
             * @description Update layer time parameter
             */
            me.setLayerTime = function (currentlayer) {
                var dimensions_time = currentlayer.layer.get('dimensions_time') || currentlayer.layer.dimensions_time;
                var d = new Date(dimensions_time.timeInterval[0]);
                switch (currentlayer.time_unit) {
                case "FullYear":
                    d.setFullYear(currentlayer.date_increment);
                    break;
                case "Month":
                    d.addMonths(currentlayer.date_increment);
                    break;
                default:
                    if (currentlayer.date_increment < currentlayer.min_time) {
                        currentlayer.date_increment = currentlayer.min_time;
                    }
                    if (currentlayer.date_increment > currentlayer.max_time) {
                        currentlayer.date_increment = currentlayer.max_time;
                    }
                    d = new Date(parseInt(currentlayer.date_increment));
                }

                currentlayer.time = d;
                currentlayer.layer.getSource().updateParams({
                    'TIME': d.toISOString()
                });
                $rootScope.$broadcast('layermanager.layer_time_changed', currentlayer.layer, d.toISOString());
            }

            return me;
                }
            ])

    /**
     * @ngdoc controller
     * @name hs.layermanager.controller
     * @memberOf hs.layermanager
     * @description Controller for management of deafult HSLayers layer manager template
     */
    .controller('hs.layermanager.controller', ['$scope', 'hs.map.service', 'config', '$rootScope', 'Core', '$compile', 'hs.utils.service', 'hs.styler.service', '$log', 'hs.ows.wms.service_capabilities', 'hs.status_creator.service', 'hs.layermanager.service', 'hs.layermanager.WMSTservice', 'hs.utils.layerUtilsService',
        function ($scope, OlMap, config, $rootScope, Core, $compile, utils, styler, $log, srv_wms_caps, status_creator, layManService, WMST, layerUtils) {

            $scope.Core = Core;
            $scope.layer_renamer_visible = false;
            $scope.data = layManService.data;

            var cur_layer_opacity = 1;
            var map;

            $scope.changeLayerVisibility = layManService.changeLayerVisibility;

            $scope.changeBaseLayerVisibility = layManService.changeBaseLayerVisibility;

            $scope.activateTheme = layManService.activateTheme;

            /**
             * @function setCurrentLayer
             * @memberOf hs.layermanager.controller
             * @description Opens detailed panel for manipulating selected layer and viewing metadata
             * @param {object} layer Selected layer to edit or view - Wrapped layer object 
             * @param {number} index Position of layer in layer manager structure - used to position the detail panel after layers li element
             */
            $scope.setCurrentLayer = function (layer, index, path) {
                if ($scope.currentlayer == layer) {
                    $scope.currentlayer = null;
                } else {
                    $scope.currentlayer = layer;
                    if (WMST.layerIsWmsT(layer)) {
                        $scope.currentlayer.time = new Date(layer.layer.getSource().getParams().TIME);
                        $scope.currentlayer.date_increment = $scope.currentlayer.time.getTime();
                    }
                    $(".layerpanel").insertAfter($("#layer" + path + index));
                    $scope.cur_layer_opacity = layer.layer.getOpacity();
                }
                return false;
            }
            /**
             * @function setLayerOpacity
             * @memberOf hs.layermanager.controller
             * @description Set selected layers opacity and emits "compositionchanged"
             * @param {Ol.layer} layer Selected layer
             */
            $scope.setLayerOpacity = function (layer) {
                layer.setOpacity($scope.cur_layer_opacity);
                $scope.$emit('compositions.composition_edited');
                return false;
            }
            /**
             * @function removeLayer
             * @memberOf hs.layermanager.controller
             * @description Removes layer from map object
             * @param {Ol.layer} layer Layer to remove
             */
            $scope.removeLayer = function (layer) {
                map.removeLayer(layer);
            }

            /** 
             * @function dragged
             * @memberOf hs.layermanager.controller
             * @param {unknow} event
             * @param {unknown} index
             * @param {unknown} item
             * @param {unknown} type
             * @param {unknown} external
             * @param {Array} layerTitles Array of layer titles of group in which layer should be moved in other position
             * Callback for dnd-drop event to change layer position in layer manager structure (drag and drop action with layers in layer manager - see https://github.com/marceljuenemann/angular-drag-and-drop-lists for more info about dnd-drop). 
             */
            $scope.draggedCont = function (event, index, item, type, external, layerTitles) {
                if (layerTitles.indexOf(item) < index) index--; //Must take into acount that this item will be removed and list will shift
                var to_title = layerTitles[index];
                var to_index = null;
                var item_index = null;
                var layers = OlMap.map.getLayers();
                //Get the position where to drop the item in the map.getLayers list and which item to remove. because we could be working only within a folder so layer_titles is small
                for (var i = 0; i < layers.getLength(); i++) {
                    if (layers.item(i).get('title') == to_title) to_index = i;
                    if (layers.item(i).get('title') == item) item_index = i;
                    if (index > layerTitles.length) to_index = i + 1; //If dragged after the last item
                }
                var item_layer = layers.item(item_index);
                map.getLayers().removeAt(item_index);
                map.getLayers().insertAt(to_index, item_layer);
                layManService.updateLayerOrder();
                $rootScope.$broadcast('layermanager.updated'); //Rebuild the folder contents
            }

            /**
             * @function zoomToLayer
             * @memberOf hs.layermanager.controller
             * @description Zoom to selected layer (layer extent). Get extent from bounding box property, getExtent() function or from BoundingBox property of GetCapabalities request (for WMS layer)
             * @param {Ol.layer} layer Selected layer
             */
            $scope.zoomToLayer = function (layer) {
                //debugger;
                var extent = null;
                if (layer.get("BoundingBox")) {
                    extent = getExtentFromBoundingBoxAttribute(layer);
                } else if (angular.isDefined(layer.getSource().getExtent)) {
                    extent = layer.getSource().getExtent();
                }
                if (extent == null && $scope.isLayerWMS(layer)) {
                    var url = null;
                    if (layer.getSource().getUrls) //Multi tile
                        url = layer.getSource().getUrls()[0];
                    if (layer.getSource().getUrl) //Single tile
                        url = layer.getSource().getUrl();
                    srv_wms_caps.requestGetCapabilities(url).then(function (capabilities_xml) {
                        //debugger;
                        var parser = new ol.format.WMSCapabilities();
                        var caps = parser.read(capabilities_xml.data);
                        if (angular.isArray(caps.Capability.Layer)) {
                            angular.forEach(caps.Capability.Layer, function (layer_def) {
                                if (layer_def.Name == layer.params.LAYERS) {
                                    layer.set('BoundingBox', layer_def.BoundingBox)
                                }
                            })
                        }
                        if (angular.isObject(caps.Capability.Layer)) {
                            layer.set('BoundingBox', caps.Capability.Layer.BoundingBox);
                            extent = getExtentFromBoundingBoxAttribute(layer);
                            if (extent != null)
                                map.getView().fit(extent, map.getSize());
                        }
                    })
                }
                if (extent != null)
                    map.getView().fit(extent, map.getSize());
            }

            /**
             * (PRIVATE) Get transformated extent from layer "BoundingBox" property
             * @function getExtentFromBoundingBoxAttribute
             * @memberOf hs.layermanager.controller
             * @param {Ol.layer} layer Selected layer
             */
            function getExtentFromBoundingBoxAttribute(layer) {
                var extent = null;
                var bbox = layer.get("BoundingBox");
                if (angular.isArray(bbox) && bbox.length == 4) {
                    extent = ol.proj.transformExtent(bbox, 'EPSG:4326', map.getView().getProjection());
                } else {
                    for (var ix = 0; ix < bbox.length; ix++) {
                        if (angular.isDefined(ol.proj.get(bbox[ix].crs)) || angular.isDefined(layer.getSource().getParams().FROMCRS)) {
                            var crs = bbox[ix].crs || layer.getSource().getParams().FROMCRS;
                            b = bbox[ix].extent;
                            var first_pair = [b[0], b[1]]
                            var second_pair = [b[2], b[3]];
                            first_pair = ol.proj.transform(first_pair, crs, map.getView().getProjection());
                            second_pair = ol.proj.transform(second_pair, crs, map.getView().getProjection());
                            extent = [first_pair[0], first_pair[1], second_pair[0], second_pair[1]];
                            break;
                        }
                    }
                }
                return extent;
            }

            /**
             * @function layerIsZoomable
             * @memberOf hs.layermanager.controller
             * @description Determines if layer has BoundingBox defined as its metadata or is a Vector layer. Used for setting visibility of 'Zoom to ' button
             * @param {Ol.layer} layer Selected layer
             */
            $scope.layerIsZoomable = layerUtils.layerIsZoomable;

            /**
             * @function layerIsStyleable
             * @memberOf hs.layermanager.controller
             * @description Determines if layer is a Vector layer and styleable. Used for allowing styling
             * @param {Ol.layer} layer Selected layer
             */
            $scope.layerIsStyleable = layerUtils.layerIsStyleable;

            /**
             * @function styleLayer
             * @memberOf hs.layermanager.controller
             * @param {Ol.layer} layer Selected layer
             * @description Display styler panel for selected layer, so user can change its style
             */
            $scope.styleLayer = function (layer) {
                styler.layer = layer;
                Core.setMainPanel('styler');
            }

            /**
             * @function removeAllLayers
             * @memberOf hs.layermanager.controller
             * @description Removes all layers which don't have 'removable' attribute set to false. If removal wasn´t confirmed display dialog first. Might reload composition again
             * @param {Boolean} confirmed Whether removing was confirmed (by user/code), (true for confirmed, left undefined for not)
             * @param {Boolean} loadComp Whether composition should be loaded again (true = reload composition, false = remove without reloading)
             */
            $scope.removeAllLayers = function (confirmed, loadComp) {
                if (typeof confirmed == 'undefined') {
                    if ($("#hs-dialog-area #hs-remove-all-dialog").length == 0) {
                        var el = angular.element('<div hs.layermanager.remove_all_dialog_directive></span>');
                        $("#hs-dialog-area").append(el)
                        $compile(el)($scope);
                    } else {
                        $('#hs-remove-all-dialog').modal('show');
                    }
                    return;
                }

                layManService.removeAllLayers();

                if (loadComp == true) {
                    $rootScope.$broadcast('compositions.load_composition', $scope.composition_id);
                }
            }

            /**
             * @function isLayerQueryable
             * @memberOf hs.layermanager.controller
             * @param {object} layer_container Selected layer - wrapped in layer object
             * @description Test if layer is queryable (WMS layer with Info format)
             */
            $scope.isLayerQueryable = function(layer_container) {
                layerUtils.isLayerQueryable(layer_container.layer);
            }
            
            /**
             * @function isLayerWMS
             * @memberOf hs.layermanager.controller
             * @param {Ol.layer} layer Selected layer
             * @description Test if layer is WMS layer
             */
            $scope.isLayerWMS = layerUtils.isLayerWMS;

            /**
             * @function dateToNonUtc
             * @memberOf hs.layermanager.controller
             * @param {Date} d Date to convert
             * @description Convert date to non Utc format
             */
            $scope.dateToNonUtc = function (d) {
                if (angular.isUndefined(d)) return;
                var noutc = new Date(d.valueOf() + d.getTimezoneOffset() * 60000);
                return noutc;
            }
            /**
             * @function toggleLayerRename
             * @memberOf hs.layermanager.controller
             * @description Toogle layer rename control on panel (through layer rename variable)
             */
            $scope.toggleLayerRename = function () {
                $scope.layer_renamer_visible = !$scope.layer_renamer_visible;
            }
            /**
             * @function setTitle
             * @memberOf hs.layermanager.controller
             * @desription Change title of layer (Angular automatically change title in object wrapper but it is needed to manually change in Ol.layer object)
             */
            $scope.setTitle = function () {
                $scope.currentlayer.layer.set('title', $scope.currentlayer.title);
            }

            /**
             * @function hasBoxLayers
             * @memberOf hs.layermanager.controller
             * @description Test if box layers are loaded
             */
            $scope.hasBoxImages = function () {
                if (angular.isDefined($scope.data.box_layers)) {
                    for (var i = 0; i < $scope.data.box_layers.length; i++) {
                        if ($scope.data.box_layers[i].get('img')) return true;
                    }
                }
                return false;
            }

            /**
             * @function isLayerInResolutionInterval
             * @memberOf hs.layermanager.controller
             * @param {Ol.layer} lyr Selected layer
             * @description Test if layer (WMS) resolution is within map interval 
             */
            $scope.isLayerInResolutionInterval = function (lyr) {
                var src = lyr.getSource();
                if (src instanceof ol.source.ImageWMS || src instanceof ol.source.TileWMS) {
                    var view = OlMap.map.getView();
                    var resolution = view.getResolution();
                    var units = map.getView().getProjection().getUnits();
                    var dpi = 25.4 / 0.28;
                    var mpu = ol.proj.METERS_PER_UNIT[units];
                    var cur_res = resolution * mpu * 39.37 * dpi;
                    return (lyr.getMinResolution() >= cur_res || cur_res >= lyr.getMaxResolution());
                } else {
                    var cur_res = OlMap.map.getView().getResolution();
                    return lyr.getMinResolution() >= cur_res && cur_res <= lyr.getMaxResolution();

                }
            }

            /**
             * @function isScaleVisible
             * @memberOf hs.layermanager.controller
             * @param {Ol.layer} layer Selected layer
             * @description Test if layer has min and max relolution set
             */
            $scope.isScaleVisible = function (layer) {
                if (typeof layer == 'undefined') return false;
                layer.minResolutionValid = false;
                layer.maxResolutionValid = false;
                if (angular.isDefined(layer.getMinResolution()) && layer.getMinResolution() != 0) {
                    layer.minResolutionValid = true;
                    layer.minResolution = layer.getMinResolution();
                }
                if (angular.isDefined(layer.getMaxResolution()) && layer.getMaxResolution() != Infinity) {
                    layer.maxResolutionValid = true;
                    layer.maxResolution = layer.getMaxResolution();
                }

                if (layer.minResolutionValid || layer.maxResolutionValid) {
                    return true;
                } else {
                    return false;
                }
            }
            /**
             * @function setLayerResolution
             * @memberOf hs.layermanager.controller
             * @param {Ol.layer} layer Selected layer
             * @description Set max and min resolution for selected layer (with layer params changed in gui)
             */
            $scope.setLayerResolution = function (layer) {
                if (typeof layer == 'undefined') return false;
                layer.setMinResolution(layer.minResolution);
                layer.setMaxResolution(layer.maxResolution);
            }

            /**
             * @function layerLoaded
             * @memberOf hs.layermanager.controller
             * @param {Ol.layer} layer Selected layer
             * @description Test if selected layer is loaded in map
             */
            $scope.layerLoaded = layerUtils.layerLoaded;
            
            /**
             * @function layerValid
             * @memberOf hs.layermanager.controller
             * @param {Ol.layer} layer Selected layer
             * @description Test if selected layer is valid (true for invalid)
             */
            $scope.layerValid = layerUtils.layerInvalid;
            
            /**
             * @function addDrawingLayer
             * @memberOf hs.layermanager.controller
             * @description Create new vector layer for drawing features by user 
             */
            $scope.addDrawingLayer = function () {
                var source = new ol.source.Vector();
                source.styleAble = true;
                source.hasPoint = true;
                source.hasPolygon = true;
                source.hasLine = true;
                var layer = new ol.layer.Vector({
                    title: 'New user graphics layer',
                    visibility: true,
                    source: source
                })
                map.getLayers().push(layer);
                $scope.$emit('layer_added', {
                    layer: status_creator.layer2json(layer)
                });
                hslayers_api.gui.Draw.setLayerToSelect(layer);
                Core.setMainPanel('draw', false, false);
            }

            $scope.$on('layer.removed', function (event, layer) {
                if (angular.isObject($scope.currentlayer) && ($scope.currentlayer.layer == layer)) {
                    $(".layerpanel").insertAfter($('.hs-lm-mapcontentlist'));
                    $scope.currentlayer = null;
                }
            });

            $scope.$on('compositions.composition_loaded', function (event, data) {
                if (angular.isUndefined(data.error)) {
                    if (angular.isDefined(data.data) && angular.isDefined(data.data.id)) {
                        $scope.composition_id = data.data.id;
                    } else if (angular.isDefined(data.id)) {
                        $scope.composition_id = data.id;
                    } else {
                        delete $scope.composition_id;
                    }
                }
            });

            $scope.$on('compositions.composition_deleted', function (event, id) {
                if (id == $scope.composition_id) {
                    delete $scope.composition_id;
                    if (!$scope.$$phase) $scope.$digest();
                }
            });

            $scope.$on('core.map_reset', function (event) {
                delete $scope.composition_id;
                if (!$scope.$$phase) $scope.$digest();
            });

            function init() {
                map = OlMap.map;
            }

            if (angular.isDefined(OlMap.map)) init();
            else {
                $rootScope.$on('map.loaded', function () {
                    init();
                });
            }    

            $scope.$emit('scope_loaded', "LayerManager");
        }
    ]);
})
