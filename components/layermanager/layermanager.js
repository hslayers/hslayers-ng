if(window.require && window.require.config) window.require.config({
    paths: {
        'hs.layermanager.layerlistDirective': hsl_path + 'components/layermanager/hs.layermanager.layerlistDirective' + hslMin,
        'hs.layermanager.service': hsl_path + 'components/layermanager/hs.layermanager.service' + hslMin,
        'hs.layermanager.WMSTservice': hsl_path + 'components/layermanager/hs.layermanager.WMSTservice' + hslMin
    }
})

/**
 * @ngdoc module
 * @module hs.layermanager
 * @name hs.layermanager
 * @description Layer manager module maintain management of layers loaded in HS Layers application. It use folder structure to enable building hiearchy of layers. All layers are wrapped inside HSLayer object, which contain auxilary informations and layer itself.
 */
define(['angular', 'map', 'ol', 'hs.layermanager.service', 'hs.layermanager.WMSTservice', 'hs.layermanager.layerlistDirective', 'utils', 'ows_wms', 'angular-drag-and-drop-lists', 'status_creator', 'styles', 'legend'], 
    function (angular, map, ol, hsLayermanagerService, hsLayermanagerWMSTservice, hsLayermanagerLayerlistDirective) {
    angular.module('hs.layermanager', ['hs.map', 'hs.utils', 'hs.ows.wms', 'dndLists', 'hs.status_creator', 'hs.styles', 'hs.legend'])
            
        /**
         * @module hs.layermanager
         * @name hs.layermanager.directive
         * @ngdoc directive
         * @description Display default HSLayers layer manager panel in application. Contain filter, baselayers, overlay container and settings pane for active layer.
         */
        .directive('hs.layermanager.directive', ['config', function(config) {
            return {
                template: require('components/layermanager/partials/layermanager.html'),
                link: function(scope, element) {

                }
            };
        }])
        // .directive('hs.baselayers.directive', function() {
        //     return {
        //         template: require('components/layermanager/partials/baselayers.html')
        //     }
        // })
        /**
         * @module hs.layermanager
         * @name hs.layermanager.removeAllDialogDirective
         * @ngdoc directive
         * @description Display warning dialog (modal) about removing all layers, in default opened when remove all layers function is used. Have option to remove all active layers, reload default composition of app or to cancel action.
         * When used in current version of HS Layers, it is recommended to append this modal directive to #hs-dialog-area element and compile scope.
         * Example
            * ```
            * var el = angular.element('<div hs.layermanager.remove_all_dialog_directive></div>');
            * document.getElementById("hs-dialog-area").appendChild(el[0]);
            * $compile(el)($scope);
            * ```
         */
        .directive('hs.layermanager.removeAllDialogDirective', ['config', function (config) {
            return {
                template: require('components/layermanager/partials/dialog_removeall.html'),
                link: function (scope, element, attrs) {
                    scope.removeAllModalVisible = true;
                }
            };
        }])
        /**
         * @module hs.layermanager
         * @name hs.layermanager.folderDirective
         * @ngdoc directive
         * @description Directive for displaying folder structure in default HS layers template. Used recursively to build full folder structure if it is created in layer manager. Single instance shows layers and subfolders of its position in folder structure.
         */
        .directive('hs.layermanager.folderDirective', ['$compile', 'config', function ($compile, config) {
            return {
                template: require('components/layermanager/partials/folder.html'),
                compile: function compile(element) {
                    var contents = element.contents().remove();
                    var contentsLinker;

                    return function (scope, iElement) {
                        /**
                         * @ngdoc method
                         * @name hs.layermanager.folderDirective#folderVisible
                         * @public
                         * @param {Object} obj Folder object of current hiearchy 
                         * @returns {Boolean} True if subfolders exists
                         * @description Find if current folder has any subfolder
                         */
                        scope.folderVisible = function (obj) {
                            return obj.sub_folders.length > 0;
                        }

                        /**
                        * @ngdoc property
                        * @name hs.layermanager.folderDirective#obj
                        * @public
                        * @type {Object} 
                        * @description Container for folder object of current folder instance. Either full folders object or its subset based on hierarchy place of directive
                        */
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
     * @module hs.layermanager
     * @name hs.layermanager.controller
     * @ngdoc controller
     * @description Controller for management of deafult HSLayers layer manager template
     */
    .controller('hs.layermanager.controller', ['$scope', 'Core', '$compile', 'hs.utils.service', 'hs.utils.layerUtilsService', 'config', 'hs.map.service', 'hs.layermanager.service', '$rootScope', '$mdDialog', 'hs.layermanager.WMSTservice', 'hs.styler.service', 'hs.legend.service',
        function($scope, Core, $compile, utils, layerUtils, config, OlMap, LayMan, $rootScope, $mdDialog, WMST, styler, legendService) {
            $scope.legendService = legendService;
            $scope.data = LayMan.data;
            $scope.Core = Core;
            $scope.layer_renamer_visible = false;
            $scope.utils = utils;

            var cur_layer_opacity = 1;
            var map;

            $scope.shiftDown = false;

            $scope.expandLayer = function(layer){
                if (angular.isUndefined(layer.expanded)) layer.expanded = true;
                else layer.expanded = !layer.expanded;
            }

            $scope.expandSettings = function(layer,value){
                if (angular.isUndefined(layer.opacity)) {
                    layer.opacity = layer.layer.getOpacity();
                    layer.maxResolutionLimit = layer.layer.getMaxResolution();
                    layer.minResolutionLimit = layer.layer.getMinResolution();
                    layer.maxResolution = layer.maxResolutionLimit;
                    layer.minResolution = layer.minResolutionLimit;
                }
                if (angular.isUndefined(layer.style) && layer.layer.getSource().styleAble) getLayerStyle(layer);
                layer.expandSettings = value;
            }

            $scope.expandFilter = function(layer,value){
                layer.expandFilter = value;
                LayMan.currentLayer = layer;
                $scope.currentLayer = LayMan.currentLayer;
            }

            /**
            * @function setOpacity
            * @memberOf hs.layermanager.controller
            * @description Set selected layers opacity and emits "compositionchanged"
            * @param {Ol.layer} layer Selected layer
            */
            $scope.setOpacity = function(layer) {
                layer.layer.setOpacity(layer.opacity);
                $scope.$emit('compositions.composition_edited');
            }

            /**
            * @function setLayerOpacity
            * @memberOf hs.layermanager.controller
            * @deprecated
            * @description Set selected layers opacity and emits "compositionchanged"
            * @param {Ol.layer} layer Selected layer
            */
            $scope.setLayerOpacity = function (layer) {
                if (angular.isUndefined(layer)) return;
                layer.setOpacity($scope.cur_layer_opacity);
                $scope.$emit('compositions.composition_edited');
                return false;
            }

            $scope.updateResolution = function(layer) {
                layer.layer.setMaxResolution(layer.maxResolution);
                layer.layer.setMinResolution(layer.minResolution);
            }

            $scope.expandInfo = function(layer,value){
                layer.expandInfo = value;
            }

            $scope.changeLayerVisibility = LayMan.changeLayerVisibility;
            $scope.changeBaseLayerVisibility = LayMan.changeBaseLayerVisibility;
            $scope.changeTerrainLayerVisibility = LayMan.changeTerrainLayerVisibility;

            $scope.layerOrder = function(layer){
                return layer.layer.get('position')
            }

            $scope.changePosition = function(layer,direction,$event) {
                var index = layer.layer.get('position');
                var layers = OlMap.map.getLayers();
                var toIndex = index;
                if (direction) {// upwards
                    var max = layers.getLength() - 1;
                    if (index < max) {
                        if ($event.shiftKey) toIndex = max;
                        else toIndex = index+1;
                    }
                }
                else {//downwards
                    var min;
                    for (var i = 0; i < layers.getLength(); i++) {
                        if (layers.item(i).get('base') != true) {
                            min = i;
                            break;
                        }
                    }
                    if (index > min) {
                        if ($event.shiftKey) toIndex = min;
                        else toIndex = index-1;
                    }
                }
                var moveLayer = layers.item(index);
                layers.removeAt(index);
                layers.insertAt(toIndex, moveLayer);
                LayMan.updateLayerOrder();
                $rootScope.$broadcast('layermanager.updated'); //Rebuild the folder contents
            }

            $scope.showRemoveLayerDiag = function(e, layer) {
                var confirm = $mdDialog.confirm()
                    .title('Remove layer ' + layer.title)
                    .textContent('Are you sure about layer removal?')
                    .ariaLabel('Confirm layer removal')
                    .targetEvent(e)
                    .ok('Remove')
                    .cancel('Cancel')
                    .hasBackdrop(false);
      
                $mdDialog.show(confirm).then(function() {
                    $scope.removeLayer(layer.layer);
                }, function() {
                });
            }

            $scope.isLayerType = function(layer, type) {
                switch (type) {
                    case 'wms':
                        return isWms(layer);
                    case 'point':
                        return layer.getSource().hasPoint;
                    case 'line':
                        return layer.getSource().hasLine;
                    case 'polygon':
                        return layer.getSource().hasPoly;
                    default:
                        return false;
                }
            }

            function isWms(layer){
                return (layer.getSource() instanceof ol.source.TileWMS || layer.getSource() instanceof ol.source.ImageWMS);
            }

            $scope.setProp = function(layer,property,value) {
                layer.set(property, value);
            }

            $scope.layerOpacity = 50;

            function getLayerStyle(wrapper){
                var layer = wrapper.layer;
                var source = layer.getSource();
                wrapper.style = {};
                if (angular.isUndefined(layer.getStyle)) return;
                var style = layer.getStyle();
                if (typeof style == 'function') style = style(source.getFeatures()[0]);
                if (typeof style == 'object') style = style[0];
                style = style.clone();
                if (source.hasPoly) {
                    wrapper.style.fillColor = style.getFill().getColor();
                }
                if (source.hasLine || source.hasPoly) {
                    wrapper.style.lineColor = style.getStroke().getColor();
                    wrapper.style.lineWidth = style.getStroke().getColor();
                }
                if (source.hasPoint) {
                    var image = style.getImage();
                    if (image instanceof ol.style.Circle) wrapper.style.pointType = 'Circle';
                    else if (image instanceof ol.style.RegularShape) {
                        wrapper.style.pointPoints = image.getPoints();
                        wrapper.style.rotation = image.getRotation();
                        if (angular.isUndefined(image.getRadius2()))wrapper.style.pointType = 'Polygon';
                        else {
                            wrapper.style.pointType = 'Star';
                            wrapper.style.radius2 = image.getRadius2();
                        }  
                    }
                    if (image instanceof ol.style.Circle || image instanceof ol.style.RegularShape) {
                        wrapper.style.radius = image.getRadius();
                        wrapper.style.pointFill = image.getFill().getColor();
                        wrapper.style.pointStroke = image.getStroke().getColor();
                        wrapper.style.pointWidth = image.getStroke().getWidth();
                    }
                    if (angular.isUndefined(wrapper.style.radius2)) wrapper.style.radius2 = wrapper.style.radius / 2;
                    if (angular.isUndefined(wrapper.style.pointPoints)) wrapper.style.pointPoints = 4;
                    if (angular.isUndefined(wrapper.style.rotation)) wrapper.style.rotation = Math.PI / 4;
                }
                wrapper.style.style = style;
            }

            $scope.saveStyle = function(layer){
                setLayerStyle(layer);
            }

            function setLayerStyle(wrapper){
                //debugger;
                var layer = wrapper.layer;
                var source = layer.getSource();
                var style = wrapper.style.style;
                if (source.hasPoly) {
                    style.setFill(new ol.style.Fill({
                        color: wrapper.style.fillColor
                    }));
                }
                if (source.hasLine || source.hasPoly) {
                    style.setStroke(new ol.style.Stroke({
                        color: wrapper.style.lineColor,
                        width: wrapper.style.lineWidth
                    }));
                }
                if (source.hasPoint) {
                    var image;
                    var stroke = new ol.style.Stroke({
                        color: wrapper.style.pointStroke,
                        width: wrapper.style.pointWidth
                    });
                    var fill = new ol.style.Fill({
                        color: wrapper.style.pointFill
                    });
                    if (wrapper.style.pointType === 'Circle') {
                        image = new ol.style.Circle({
                            stroke: stroke,
                            fill: fill,
                            radius: wrapper.style.radius,
                            rotation: wrapper.style.rotation
                        });
                    } 
                    if (wrapper.style.pointType === 'Polygon') {
                        image = new ol.style.RegularShape({
                            stroke: stroke,
                            fill: fill,
                            radius: wrapper.style.radius,
                            points: wrapper.style.pointPoints,
                            rotation: wrapper.style.rotation
                        }); 
                    }
                    if (wrapper.style.pointType === 'Star') {
                        image = new ol.style.RegularShape({
                            stroke: stroke,
                            fill: fill,
                            radius1: wrapper.style.radius,
                            radius2: wrapper.style.radius2,
                            points: wrapper.style.pointPoints,
                            rotation: wrapper.style.rotation
                        });
                    }
                    style.setImage(image); 
                }
                layer.setStyle(style);
            }

            $scope.changePointType = function(layer,type) {
                if (angular.isUndefined(layer.style)) getLayerStyle(layer);
                layer.style.pointType = type;
                setLayerStyle(layer);
            }

            $scope.icons = ["bag1.svg", "banking4.svg", "bar.svg", "beach17.svg", "bicycles.svg", "building103.svg", "bus4.svg", "cabinet9.svg", "camping13.svg", "caravan.svg", "church15.svg", "church1.svg", "coffee-shop1.svg", "disabled.svg", "favourite28.svg", "football1.svg", "footprint.svg", "gift-shop.svg", "gps40.svg", "gps41.svg", "gps42.svg", "gps43.svg", "gps5.svg", "hospital.svg", "hot-air-balloon2.svg", "information78.svg", "library21.svg", "location6.svg", "luggage13.svg", "monument1.svg", "mountain42.svg", "museum35.svg", "park11.svg", "parking28.svg", "pharmacy17.svg", "port2.svg", "restaurant52.svg", "road-sign1.svg", "sailing-boat2.svg", "ski1.svg", "swimming26.svg", "telephone119.svg", "toilets2.svg", "train-station.svg", "university2.svg", "warning.svg", "wifi8.svg"];

             /**
             * @function isLayerRemovable
             * @memberOf hs.layermanager.controller
             * @description Check if layer can be removed based on 'removable' layer attribute
             * @param {Ol.layer} lyr OL layer to check if removable
             */
            $scope.isLayerRemovable = function(lyr){
                return angular.isDefined(lyr) && (angular.isUndefined(lyr.get('removable')) || lyr.get('removable') == true);
            }

            $scope.removeLayer = function (layer) {
                OlMap.map.removeLayer(layer);
                $rootScope.$broadcast('layermanager.updated'); //Rebuild the folder contents
            }

            $scope.activateTheme = LayMan.activateTheme;

            /**
             * @function toggleCurrentLayer
             * @memberOf hs.layermanager.controller
             * @description Opens detailed panel for manipulating selected layer and viewing metadata
             * @param {object} layer Selected layer to edit or view - Wrapped layer object 
             * @param {number} index Position of layer in layer manager structure - used to position the detail panel after layers li element
             */

            $scope.setCurrentLayer = function(layer, index, path) {
                LayMan.currentLayer = layer;
                $scope.currentLayer = LayMan.currentLayer;
                if (WMST.layerIsWmsT(layer)) {
                    LayMan.currentLayer.time = new Date(layer.layer.getSource().getParams().TIME);
                    LayMan.currentLayer.date_increment = LayMan.currentLayer.time.getTime();
                }
                var layerPanel = document.getElementsByClassName('layerpanel');
                var layerNode = document.getElementById('layer' + (path || '') + (index || ''));	
                utils.insertAfter(layerPanel, layerNode);
                $scope.legendDescriptors = [];
                var tmpDescriptor = (layer ? legendService.getLayerLegendDescriptor(layer.layer) : false);
                if(tmpDescriptor) $scope.legendDescriptors.push(tmpDescriptor);
                $scope.cur_layer_opacity = layer.layer.getOpacity();
                return false;
            }

            $scope.currentLayer = LayMan.currentLayer;
            $scope.toggleCurrentLayer = function (layer, index, path) {
                if (LayMan.currentLayer == layer) {
                    LayMan.currentLayer = null;
                } else {
                    $scope.setCurrentLayer(layer, index, path)
                }
                $scope.currentLayer = LayMan.currentLayer;
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
             * This is called from layerlistDirective
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
                LayMan.updateLayerOrder();
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
                    if (document.getElementById("hs-remove-all-dialog") == null) {
                        var el = angular.element('<div hs.layermanager.remove_all_dialog_directive></div>');
                        document.getElementById("hs-dialog-area").appendChild(el[0]);
                        $compile(el)($scope);
                    } else {
                        $scope.removeAllModalVisible = true;
                    }
                    return;
                }

                LayMan.removeAllLayers();

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
                LayMan.currentLayer.layer.set('title', LayMan.currentLayer.title);
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
             * @function isLayerWithDimensions
             * @memberOf hs.layermanager.controller
             * @param {Ol.layer} lyr Selected layer
             * @description Test if layer has dimensions
             */
            $scope.isLayerWithDimensions = function (lyr_container) {
                if(angular.isUndefined(lyr_container) || lyr_container == null || angular.isUndefined(lyr_container.layer)) return false;
                if(angular.isUndefined(lyr_container.layer.get('dimensions'))) return false;
                return Object.keys(lyr_container.layer.get('dimensions')).length > 0
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
            
            
            $scope.layerIsWmsT = WMST.layerIsWmsT;
            $scope.setLayerTime = WMST.setLayerTime;

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

            $scope.dimensionChanged = function(currentlayer, dimension){
                $scope.$emit('layermanager.dimension_changed', {layer: currentlayer.layer, dimension: dimension});
            }

            $scope.$on('layer.removed', function (event, layer) {
                if (angular.isObject(LayMan.currentLayer) && (LayMan.currentLayer.layer == layer)) {
                    var layerPanel = document.getElementsByClassName('layerpanel');
                    var layerNode = document.getElementsByClassName('hs-lm-mapcontentlist')[0];	
                    utils.insertAfter(layerPanel, layerNode);
                    LayMan.currentLayer = null;
                    $scope.currentLayer = LayMan.currentLayer;
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
                $timeout(function(){
                    delete $scope.composition_id;
                })
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

    hsLayermanagerLayerlistDirective.init();
    hsLayermanagerService.init();
    hsLayermanagerWMSTservice.init();
})
