/**
 * @namespace hs.layermanager
 * @memberOf hs
 */
define(['angular', 'app', 'map', 'ol'], function(angular, app, map, ol) {
    angular.module('hs.layermanager', ['hs.map'])

    /**
     * @class hs.layermanager.directive
     * @memberOf hs.layermanager
     * @description Directive for displaying layer manager panel
     */
    .directive('hs.layermanager.directive', function() {
        return {
            templateUrl: hsl_path + 'components/layermanager/partials/layermanager.html'
        };
    })

    .directive('hs.layermanager.layerlistDirective', ['$compile', function($compile) {
        return {
            templateUrl: hsl_path + 'components/layermanager/partials/layerlist.html',
            compile: function compile(element) {
                var contents = element.contents().remove();
                var contentsLinker;

                return function(scope, iElement) {
                    scope.layerBelongsToFolder = function(layer, obj) {
                        return layer.layer.get('path') == obj.hsl_path || ((typeof layer.layer.get('path') == 'undefined' || layer.layer.get('path') == '') && obj.hsl_path == '');
                    }

                    if (scope.value == null) {
                        scope.obj = scope.folders;
                    } else {
                        scope.obj = scope.value;
                    }

                    if (angular.isUndefined(contentsLinker)) {
                        contentsLinker = $compile(contents);
                    }

                    contentsLinker(scope, function(clonedElement) {
                        iElement.append(clonedElement);
                    });
                };
            }
        };
    }])

    /**
     * @class hs.layermanager.removeAllDialogDirective
     * @memberOf hs.layermanager
     * @description Directive for displaying warning dialog about resampling (proxying) wms service
     */
    .directive('hs.layermanager.removeAllDialogDirective', function() {
        return {
            templateUrl: hsl_path + 'components/layermanager/partials/dialog_removeall.html',
            link: function(scope, element, attrs) {
                $('#hs-remove-all-dialog').modal('show');
            }
        };
    })

    /**
     * @class hs.layermanager.folderDirective
     * @memberOf hs.layermanager
     * @description Directive for displaying folder. Used recursively
     */
    .directive('hs.layermanager.folderDirective', ['$compile', function($compile) {
        return {
            templateUrl: hsl_path + 'components/layermanager/partials/folder.html',
            compile: function compile(element) {
                var contents = element.contents().remove();
                var contentsLinker;

                return function(scope, iElement) {
                    scope.folderVisible = function(obj) {
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

                    contentsLinker(scope, function(clonedElement) {
                        iElement.append(clonedElement);
                    });
                };
            }
        };
    }])

    /**
     * @class hs.layermanager.controller
     * @memberOf hs.layermanager
     * @description Layer manager controller
     */
    .controller('hs.layermanager.controller', ['$scope', 'hs.map.service', 'config', '$rootScope', 'Core', '$compile',
        function($scope, OlMap, config, $rootScope, Core, $compile) {
            $scope.Core = Core;
            $scope.folders = {
                hsl_path: '',
                layers: [],
                sub_folders: [],
                indent: 0
            };
            var map = OlMap.map;
            var cur_layer_opacity = 1;

            /**
             * @function layerAdded
             * @memberOf hs.layermanager.controller
             * @description Callback function for layer adding
             * @param {ol.CollectionEvent} e - Events emitted by ol.Collection instances are instances of this type.
             */
            function layerAdded(e) {
                if (e.element.get('show_in_manager') != null && e.element.get('show_in_manager') == false) return;
                var sub_layers;
                if (e.element.getSource().getParams) { // Legend only for wms layers with params
                    sub_layers = e.element.getSource().getParams().LAYERS.split(",");
                    for (var i = 0; i < sub_layers.length; i++) {
                        if (e.element.getSource().getUrls) //Multi tile
                            sub_layers[i] = e.element.getSource().getUrls()[0] + (e.element.getSource().getUrls()[0].indexOf('?') > 0 ? '' : '?') + "&version=1.3.0&service=WMS&request=GetLegendGraphic&sld_version=1.1.0&layer=" + sub_layers[i] + "&format=image%2Fpng";
                        if (e.element.getSource().getUrl) //Single tile
                            sub_layers[i] = e.element.getSource().getUrl() + (e.element.getSource().getUrl().indexOf('?') > 0 ? '' : '?') + "&version=1.3.0&service=WMS&request=GetLegendGraphic&sld_version=1.1.0&layer=" + sub_layers[i] + "&format=image%2Fpng";
                    }
                }
                e.element.on('change:visible', function(e) {
                    for (var i = 0; i < $scope.layers.length; i++) {
                        if ($scope.layers[i].layer == e.target) {
                            $scope.layers[i].visible = e.target.getVisible();
                            break;
                        }
                    }
                    if (!$scope.$$phase) $scope.$digest();
                })
                populateFolders(e.element);
                $scope.layers.push({
                    title: e.element.get("title"),
                    layer: e.element,
                    grayed: $scope.isLayerInResolutionInterval(e.element),
                    sub_layers: sub_layers,
                    visible: e.element.getVisible()
                });
                $rootScope.$broadcast('layermanager.updated', e.element);
            };

            /**
             * @function populateFolders
             * @memberOf hs.layermanager.controller
             * @description Take path property of layer and add it to layer managers folder structure
             * @param {ol.Layer} lyr - Layer
             */
            function populateFolders(lyr) {
                if (typeof lyr.get('path') !== 'undefined' && lyr.get('path') !== 'undefined') {
                    var path = lyr.get('path');
                    var parts = path.split('/');
                    var curfolder = $scope.folders;
                    for (var i = 0; i < parts.length; i++) {
                        var found = null;
                        angular.forEach(curfolder.sub_folders, function(folder) {
                            if (folder.name == parts[i])
                                found = folder;
                        })
                        if (found == null) {
                            var new_folder = {
                                sub_folders: [],
                                indent: i,
                                layers: [],
                                name: parts[i],
                                hsl_path: curfolder.hsl_path + (curfolder.hsl_path != '' ? '/' : '') + parts[i]
                            };
                            curfolder.sub_folders.push(new_folder);
                            curfolder = new_folder;
                        } else {
                            curfolder = found;
                        }
                    }
                    curfolder.layers.push(lyr);
                } else {
                    $scope.folders.layers.push(lyr);
                }
            }

            /**
             * @function layerRemoved
             * @memberOf hs.layermanager.controller
             * @description Callback function for layer removing
             * @param {ol.CollectionEvent} e - Events emitted by ol.Collection instances are instances of this type.
             */
            function layerRemoved(e) {
                $(".layermanager-list").prepend($('.layerpanel'));
                $scope.currentlayer = null;
                for (var i = 0; i < $scope.layers.length; i++) {
                    if ($scope.layers[i].layer == e.element) {
                        $scope.layers.splice(i, 1);
                    }
                }
                $rootScope.$broadcast('layermanager.updated', e.element);
            };

            $scope.box_layers = config.box_layers;
            $scope.layers = [];
            $scope.active_box = null;

            /**
             * @function changeLayerVisibility
             * @memberOf hs.layermanager.controller
             * @description Callback function to set layers visibility
             * @param {object} $event - Info about the event and checkbox being clicked on
             * @param {object} layer - Wrapped ol.Layer
             */
            $scope.changeLayerVisibility = function($event, layer) {
                layer.layer.setVisible($event.target.checked);
            }

            /**
             * @function setCurrentLayer
             * @memberOf hs.layermanager.controller
             * @description Opens detailed view for manipulating layer and viewing metadata
             * @param {object} layer - Wrapped layer to edit or view
             * @param {number} index - Used to position the detail panel after layers li element
             */
            $scope.setCurrentLayer = function(layer, index) {
                $scope.currentlayer = layer;
                $(".layerpanel").insertAfter($("#layer-" + index));
                $scope.cur_layer_opacity = layer.layer.getOpacity();
                if (console) console.log(layer);
                return false;
            }

            /**
             * @function removeLayer
             * @memberOf hs.layermanager.controller
             * @description Removes layer from map
             * @param {object} layer
             */
            $scope.removeLayer = function(layer) {
                map.removeLayer(layer);
            }

            /**
             * @function zoomToLayer
             * @memberOf hs.layermanager.controller
             * @description Tries to read the BoundingBox property of layer or getExtent() of its source and zooms to it
             * @param {object} layer
             */
            $scope.zoomToLayer = function(layer) {
                var extent = null;
                if (layer.get("BoundingBox")) {
                    var bbox = layer.get("BoundingBox");
                    for (var ix = 0; ix < bbox.length; ix++) {
                        if (typeof ol.proj.get(bbox[ix].crs) !== 'undefined') {
                            b = bbox[ix].extent;
                            var first_pair = [b[0], b[1]]
                            var second_pair = [b[2], b[3]];
                            first_pair = ol.proj.transform(first_pair, bbox[ix].crs, map.getView().getProjection().getCode());
                            second_pair = ol.proj.transform(second_pair, bbox[ix].crs, map.getView().getProjection());
                            extent = [first_pair[0], first_pair[1], second_pair[0], second_pair[1]];
                            break;
                        }
                    }
                } else {
                    extent = layer.getSource().getExtent();
                }
                if (extent != null)
                    map.getView().fitExtent(extent, map.getSize());
            }

            /**
             * @function layerIsZoomable
             * @memberOf hs.layermanager.controller
             * @description Determines if layer has BoundingBox defined as its metadata or is a Vector layer. Used for setting visibility of 'Zoom to ' button
             * @param {object} layer
             */
            $scope.layerIsZoomable = function(layer) {
                if (typeof layer == 'undefined') return false;
                if (layer.get("BoundingBox")) return true;
                if (layer.getSource().getExtent && layer.getSource().getExtent()) return true;
                return false;
            }

            /**
             * @function removeAllLayers
             * @memberOf hs.layermanager.controller
             * @description Removes all layers which don't have 'removable' attribute set to false
             */
            $scope.removeAllLayers = function(confirmed) {
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
                var to_be_removed = [];
                OlMap.map.getLayers().forEach(function(lyr) {
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
             * @memberOf hs.layermanager.controller
             * @description Show a particular groups layers, hide allthe rest
             * @param {ol.layer.Group} theme - Group layer to activate
             */
            $scope.activateTheme = function(theme) {
                if ($scope.active_box) $scope.active_box.set('active', false);
                $scope.active_box = theme;
                theme.set('active', true);
                angular.forEach($scope.box_layers, function(box) {
                    box.setVisible(box == theme);
                    angular.forEach(box.get('layers'), function(lyr) {
                        if (lyr.get('base') == true) return;
                        lyr.setVisible(box.getVisible());
                    });
                });
            }

            $scope.hasBoxLayers = function() {
                for (vari = 0; i < $scope.box_layers.length; i++) {
                    if ($scope.box_layers[i].img) return true;
                }
                return false;
            }
            $scope.isLayerInResolutionInterval = function(lyr){
                var cur_res = OlMap.map.getView().getResolution();
                return lyr.getMinResolution()>=cur_res && cur_res<=lyr.getMaxResolution();
            }

            OlMap.map.getLayers().forEach(function(lyr) {
                layerAdded({
                    element: lyr
                });
            });
            var timer;
            OlMap.map.getView().on('change:resolution', function(e) {
                if (timer != null) clearTimeout(timer);
                timer = setTimeout(function() {
                    for (var i = 0; i < $scope.layers.length; i++) {
                        $scope.layers[i].grayed = $scope.isLayerInResolutionInterval($scope.layers[i].layer);
                    }
                    if (!$scope.$$phase) $scope.$digest();
                }, 500);
            });
            map.getLayers().on("add", layerAdded);
            map.getLayers().on("remove", layerRemoved);
            $scope.$emit('scope_loaded', "LayerManager");
        }
    ]);
})
