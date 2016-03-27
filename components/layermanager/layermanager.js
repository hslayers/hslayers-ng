/**
 * @namespace hs.layermanager
 * @memberOf hs
 */
define(['angular', 'app', 'map', 'ol', 'utils'], function(angular, app, map, ol) {
    angular.module('hs.layermanager', ['hs.map', 'hs.utils'])

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
                        return layer.layer.get('path') == obj.hsl_path || ((angular.isUndefined(layer.layer.get('path')) || layer.layer.get('path') == '') && obj.hsl_path == '');
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
    .controller('hs.layermanager.controller', ['$scope', 'hs.map.service', 'config', '$rootScope', 'Core', '$compile', 'hs.utils.service', 'hs.styler.service', '$log',
        function($scope, OlMap, config, $rootScope, Core, $compile, utils, styler, $log) {
            $scope.Core = Core;
            $scope.layer_renamer_visible = false;
            $scope.folders = {
                hsl_path: '',
                layers: [],
                sub_folders: [],
                indent: 0
            };
            var map = OlMap.map;
            var cur_layer_opacity = 1;

            function getLegendUrl(source_url, layer_name) {
                if (source_url.indexOf('proxy4ows') > -1) {
                    var params = utils.getParamsFromUrl(source_url);
                    source_url = params.OWSURL;
                }
                source_url += (source_url.indexOf('?') > 0 ? '' : '?') + "&version=1.3.0&service=WMS&request=GetLegendGraphic&sld_version=1.1.0&layer=" + layer_name + "&format=image%2Fpng";
                return source_url;
            }

            /**
             * @function layerAdded
             * @memberOf hs.layermanager.controller
             * @description Callback function for layer adding
             * @param {ol.CollectionEvent} e - Events emitted by ol.Collection instances are instances of this type.
             */
            function layerAdded(e) {
                $scope.layerIsWmsT(e.element);
                if (e.element.get('show_in_manager') != null && e.element.get('show_in_manager') == false) return;
                var sub_layers;
                if (e.element.getSource().getParams) { // Legend only for wms layers with params
                    sub_layers = e.element.getSource().getParams().LAYERS.split(",");
                    for (var i = 0; i < sub_layers.length; i++) {
                        if (e.element.getSource().getUrls) //Multi tile
                            sub_layers[i] = getLegendUrl(e.element.getSource().getUrls()[0], sub_layers[i]);
                        if (e.element.getSource().getUrl) //Single tile
                            sub_layers[i] = getLegendUrl(e.element.getSource().getUrl(), sub_layers[i]);
                    }
                }
                if (e.element.get('base') != true) {
                    e.element.on('change:visible', function(e) {
                        for (var i = 0; i < $scope.layers.length; i++) {
                            if ($scope.layers[i].layer == e.target) {
                                $scope.layers[i].visible = e.target.getVisible();
                                break;
                            }
                        }
                        if (!$scope.$$phase) $scope.$digest();
                    })
                }
                if (angular.isDefined(e.element.get('title'))) {
                    var new_title = e.element.get('title').replace(/&#47;/g, '/');

                } else {
                    var new_title = 'Void';

                }
                var new_layer = {
                    title: new_title,
                    layer: e.element,
                    grayed: $scope.isLayerInResolutionInterval(e.element),
                    visible: e.element.getVisible()
                };
                if ($scope.layerIsWmsT(new_layer)) {
                    var metadata = new_layer.layer.get('metadata') || new_layer.layer.metadata;
                    angular.extend(new_layer, {
                        time_step: metadata.timeStep,
                        time_unit: metadata.timeUnit,
                        date_format: getDateFormatForTimeSlider(metadata.timeUnit),
                        date_from: new Date(metadata.timeInterval[0]),
                        date_till: new Date(metadata.timeInterval[1]),
                        time: new Date(metadata.timeInterval[0])
                    });
                    setLayerTimeSliderIntervals(new_layer, metadata);
                }
                if (e.element.get('base') != true) {
                    populateFolders(e.element);
                    if (e.element.get('legends')) {
                        new_layer.legends = e.element.get('legends');
                    }
                    $scope.layers.push(new_layer);
                } else {
                    new_layer.active = e.element.getVisible();
                    $scope.baselayers.push(new_layer);
                };

                if (e.element.getVisible() && e.element.get("base")) $scope.baselayer = new_title;
                $rootScope.$broadcast('layermanager.updated', e.element);
                $scope.$emit('compositions.composition_edited');
            };

            function getDateFormatForTimeSlider(time_unit) {
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

            function setLayerTimeSliderIntervals(new_layer, metadata) {
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
             * @function populateFolders
             * @memberOf hs.layermanager.controller
             * @description Take path property of layer and add it to layer managers folder structure
             * @param {ol.Layer} lyr - Layer
             */
            function populateFolders(lyr) {
                if (angular.isDefined(lyr.get('path')) && lyr.get('path') !== 'undefined') {
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
                if (angular.isObject($scope.currentlayer) && ($scope.currentlayer.layer == e.element)) {
                    $(".layerpanel").insertAfter($('.hs-lm-mapcontentlist'));
                    $scope.currentlayer = null;
                }
                for (var i = 0; i < $scope.layers.length; i++) {
                    if ($scope.layers[i].layer == e.element) {
                        $scope.layers.splice(i, 1);
                    }
                }
                for (var i = 0; i < $scope.baselayers.length; i++) {
                    if ($scope.baselayers[i].layer == e.element) {
                        $scope.baselayers.splice(i, 1);
                    }
                }
                $rootScope.$broadcast('layermanager.updated', e.element);
                $scope.$emit('compositions.composition_edited');
            };

            $scope.box_layers = config.box_layers;
            $scope.layers = [];
            $scope.baselayers = [];
            $scope.baselayersVisible = true;
            $scope.active_box = null;

            /**
             * @function changeLayerVisibility
             * @memberOf hs.layermanager.controller
             * @description Callback function to set layers visibility
             * @param {object} $event - Info about the event and checkbox being clicked on
             * @param {object} layer - Wrapped ol.Layer
             */
            $scope.changeLayerVisibility = function(visibility, layer) {
                layer.layer.setVisible(visibility);
                layer.visible = visibility;
            }

            /**
             * @function changeBaseLayerVisibility
             * @memberOf hs.layermanager.controller
             * @description Callback function to set layers visibility
             * @param {object} $event - Info about the event and checkbox being clicked on
             * @param {object} layer - Wrapped ol.Layer
             */
            $scope.changeBaseLayerVisibility = function($event, layer) {
                if ($scope.baselayersVisible == true) {
                    if ($event) {
                        for (var i = 0; i < $scope.baselayers.length; i++) {
                            if ($scope.baselayers[i] != layer) {
                                $scope.baselayers[i].layer.setVisible(false);
                                $scope.baselayers[i].visible = false;
                                $scope.baselayers[i].active = false;
                            } else {
                                $scope.baselayers[i].layer.setVisible(true);
                                $scope.baselayers[i].visible = true;
                                $scope.baselayers[i].active = true;
                            }
                        }
                    } else {
                        $scope.baselayersVisible = false;
                        for (var i = 0; i < $scope.baselayers.length; i++) {
                            $scope.baselayers[i].layer.setVisible(false);
                        }
                    }
                } else {
                    if ($event) {
                        layer.active = true;
                        for (var i = 0; i < $scope.baselayers.length; i++) {
                            if ($scope.baselayers[i] != layer) {
                                $scope.baselayers[i].active = false;
                            }
                        }
                    } else {
                        $scope.baselayersVisible = true;
                        for (var i = 0; i < $scope.baselayers.length; i++) {
                            if ($scope.baselayers[i].active == true) {
                                $scope.baselayers[i].layer.setVisible(true);
                            }
                        }
                    }
                }
            }

            /**
             * @function setCurrentLayer
             * @memberOf hs.layermanager.controller
             * @description Opens detailed view for manipulating layer and viewing metadata
             * @param {object} layer - Wrapped layer to edit or view
             * @param {number} index - Used to position the detail panel after layers li element
             */
            $scope.setCurrentLayer = function(layer, index) {
                if ($scope.currentlayer == layer) {
                    $scope.currentlayer = null;
                } else {
                    $scope.currentlayer = layer;
                    $(".layerpanel").insertAfter($("#layer-" + index));
                    $scope.cur_layer_opacity = layer.layer.getOpacity();
                }
                return false;
            }

            /**
             * @function setOpacity
             * @memberOf hs.layermanager.controller
             * @description Set layers opacity and emits compositionchanged
             * @param {object} layer - Layer on which is opacity set
             */
            $scope.setLayerOpacity = function(layer, opacity) {
                layer.setOpacity($scope.cur_layer_opacity);
                $scope.$emit('compositions.composition_edited');
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
                    if (angular.isArray(bbox)) {
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
                } else {
                    extent = layer.getSource().getExtent();
                }
                if (extent != null)
                    map.getView().fit(extent, map.getSize());
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
                if (layer.getSource().getExtent && layer.getSource().getExtent() && !ol.extent.isEmpty(layer.getSource().getExtent())) return true;
                return false;
            }

            /**
             * @function layerIsStyleable
             * @memberOf hs.layermanager.controller
             * @description Determines if layer is a Vector layer and styleable. Used for allowing styling
             * @param {object} layer
             */
            $scope.layerIsStyleable = function(layer) {
                if (typeof layer == 'undefined') return false;
                if (layer instanceof ol.layer.Vector && layer.getSource().styleAble) return true;
                return false;
            }

            $scope.parseInterval = function(interval) {
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


            $scope.layerIsWmsT = function(layer_container) {
                if (angular.isUndefined(layer_container) || layer_container == null) return false;
                var layer = layer_container.layer;
                if (angular.isUndefined(layer)) return false;
                if (layer.get('metadata') && angular.isArray(layer.get('metadata').timeInterval)) return true;
                if (layer.get('dimensions') && angular.isObject(layer.get('dimensions').time)) {
                    var metadata = {};
                    var value = layer.get('dimensions').time.values;
                    value = value.replace(/\s*/g, "");

                    if (value.search("/") > -1) {
                        var interval = value.split("/").map(function(d) {
                            if (d.search("Z") > -1) {
                                d = d.replace("Z", "00:00");
                            }
                            return d;
                        });

                        if (interval.length == 3) {
                            metadata.timeStep = $scope.parseInterval(interval[2]);
                            interval.pop();
                        }

                        metadata.timeInterval = interval;
                    }
                    angular.extend(layer, {
                        metadata: metadata
                    })
                    return true;
                }
                return false;
            }



            $scope.styleLayer = function(layer) {
                styler.layer = layer;
                Core.setMainPanel('styler');
            }

            /**
             * @function removeAllLayers
             * @memberOf hs.layermanager.controller
             * @description Removes all layers which don't have 'removable' attribute set to false
             */
            $scope.removeAllLayers = function(confirmed, loadComp) {
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

                if (loadComp == true) {
                    $rootScope.$broadcast('compositions.load_composition', $scope.composition_id);
                }
            }

            $scope.isLayerQueryable = function(layer_container) {
                var layer = layer_container.layer;
                if (layer instanceof ol.layer.Tile &&
                    (layer.getSource() instanceof ol.source.TileWMS) &&
                    layer.getSource().getParams().INFO_FORMAT) return true;
                if (layer instanceof ol.layer.Image &&
                    layer.getSource() instanceof ol.source.ImageWMS &&
                    layer.getSource().getParams().INFO_FORMAT) return true;
                return false;
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

            $scope.setLayerTime = function(currentlayer) {
                var metadata = currentlayer.layer.get('metadata') || currentlayer.layer.metadata;
                var d = new Date(metadata.timeInterval[0]);
                switch (currentlayer.time_unit) {
                    case "FullYear":
                        d.setFullYear(currentlayer.date_increment);
                        break;
                    case "Month":
                        d.addMonths(currentlayer.date_increment);
                        break;
                    default:
                        if ((currentlayer.date_increment > currentlayer.min_time) && (currentlayer.date_increment < currentlayer.max_time)) {
                            d = new Date(parseInt(currentlayer.date_increment));
                        } else {
                            d = currentlayer.time;
                        }
                }
                currentlayer.time = d;
                currentlayer.layer.getSource().updateParams({
                    'TIME': d.toISOString()
                });
            }

            $scope.toggleLayerRename = function() {
                $scope.layer_renamer_visible = !$scope.layer_renamer_visible;
            }

            $scope.setTitle = function() {
                $scope.currentlayer.layer.set('title', $scope.currentlayer.title);
            }

            $scope.hasBoxLayers = function() {
                for (vari = 0; i < $scope.box_layers.length; i++) {
                    if ($scope.box_layers[i].img) return true;
                }
                return false;
            }
            $scope.isLayerInResolutionInterval = function(lyr) {
                var cur_res = OlMap.map.getView().getResolution();
                return lyr.getMinResolution() >= cur_res && cur_res <= lyr.getMaxResolution();
            }
            $scope.isScaleVisible = function(layer) {
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

            $scope.setLayerResolution = function(layer) {
                if (typeof layer == 'undefined') return false;
                layer.setMinResolution(layer.minResolution);
                layer.setMaxResolution(layer.maxResolution);
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

            $scope.$on('compositions.composition_loaded', function(event, data) {
                $scope.composition_id = data.data.id || data.id;
            });

            $scope.$on('compositions.composition_deleted', function(event, id) {
                if (id == $scope.composition_id) {
                    delete $scope.composition_id;
                    if (!$scope.$$phase) $scope.$digest();
                }
            });

            $scope.$on('core.map_reset', function(event) {
                delete $scope.composition_id;
                if (!$scope.$$phase) $scope.$digest();
            });

            map.getLayers().on("add", layerAdded);
            map.getLayers().on("remove", layerRemoved);
            $scope.$emit('scope_loaded', "LayerManager");
        }
    ]);
})
