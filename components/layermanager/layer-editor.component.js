import { Stroke, Fill, Circle, RegularShape, Text, Style } from 'ol/style';
import { transform, get as getProj, METERS_PER_UNIT, transformExtent } from 'ol/proj';
import { WMSCapabilities, WMTSCapabilities } from 'ol/format';
import VectorLayer from 'ol/layer/Vector';
import WFS from 'ol/format';
import { Cluster, Vector as VectorSource } from 'ol/source';


export default {
    template: require('./partials/layer-editor.html'),
    bindings: {
        currentLayer: '='
    },
    controller: ['$scope', 'Core', '$compile', 'hs.utils.service',
        'hs.utils.layerUtilsService', 'config', 'hs.layermanager.WMSTservice',
        'hs.legend.service', 'hs.styler.service', 'hs.map.service',
        'hs.layermanager.service', 'hs.wms.getCapabilitiesService', '$rootScope', '$timeout', 'hs.layout.service', 'hs.layerEditor.sublayerService', 'hs.layerEditorVectorLayer.service',
        function ($scope, Core, $compile, utils, layerUtils, config, WMST, legendService, styler, hsMap, LayMan, WMSgetCapabilitiesService, $rootScope, $timeout, layoutService,
            subLayerService, vectorLayerService) {
            $scope.distance = {
                value: 40
            };
            angular.extend($scope, {
                layer_renamer_visible: false,
                legendService,
                layerIsWmsT() { return WMST.layerIsWmsT($scope.$ctrl.currentLayer) },
                /**
                 * @function isLayerWMS
                 * @memberOf hs.layermanager.controller
                 * @param {Ol.layer} layer Selected layer
                 * @description Test if layer is WMS layer
                 */
                isLayerWMS: layerUtils.isLayerWMS,
                /**
                 * @function zoomToLayer
                 * @memberOf hs.layermanager.controller
                 * @description Zoom to selected layer (layer extent). Get extent 
                 * from bounding box property, getExtent() function or from 
                 * BoundingBox property of GetCapabalities request (for WMS layer)
                 */
                zoomToLayer() {
                    let layer = $scope.olLayer();
                    var extent = null;
                    if (layer.get("BoundingBox")) {
                        extent = $scope.getExtentFromBoundingBoxAttribute(layer);
                    } else if (angular.isDefined(layer.getSource().getExtent)) {
                        extent = layer.getSource().getExtent();
                    }
                    if (extent == null && $scope.isLayerWMS(layer)) {
                        var url = null;
                        if (layer.getSource().getUrls) //Multi tile
                            url = layer.getSource().getUrls()[0];
                        if (layer.getSource().getUrl) //Single tile
                            url = layer.getSource().getUrl();
                        WMSgetCapabilitiesService.requestGetCapabilities(url)
                            .then(function (capabilities_xml) {
                                //debugger;
                                var parser = new WMSCapabilities();
                                var caps = parser.read(capabilities_xml);
                                if (angular.isArray(caps.Capability.Layer)) {
                                    angular.forEach(caps.Capability.Layer, function (layer_def) {
                                        if (layer_def.Name == layer.params.LAYERS) {
                                            layer.set('BoundingBox', layer_def.BoundingBox)
                                        }
                                    })
                                }
                                if (angular.isObject(caps.Capability.Layer)) {
                                    layer.set('BoundingBox', caps.Capability.Layer.BoundingBox);
                                    extent = $scope.getExtentFromBoundingBoxAttribute(layer);
                                    if (extent != null)
                                        hsMap.map.getView().fit(extent, hsMap.map.getSize());
                                }
                            })
                    }
                    if (extent != null)
                        hsMap.map.getView().fit(extent, hsMap.map.getSize());
                },

                /**
                 * @function styleLayer
                 * @memberOf hs.layermanager.controller
                 * @param {Ol.layer} layer Selected layer
                 * @description Display styler panel for selected layer, so user can change its style
                 */
                styleLayer() {
                    let layer = $scope.olLayer();
                    styler.layer = layer;
                    layoutService.setMainPanel('styler');
                },
                /**
                * @function isLayerVectorLayer
                * @memberOf hs.layermanager.controller
                * @param {Ol.layer} layer Selected layer
                * @description Test if layer is WMS layer
                */
                isLayerVectorLayer: layerUtils.isLayerVectorLayer,
                /**
                 * @function isVectorLayer
                 * @memberOf hs.layermanager.controller
                 * @param {Ol.layer} layer Selected layer
                 * @description Test if layer is WMS layer
                 */
                isVectorLayer() {
                    if (!$scope.$ctrl.currentLayer) return;
                    let layer = $scope.olLayer();
                    if (!$scope.isLayerVectorLayer(layer)) return;
                    else return true;
                },
                /**
                 * @function isOptionsDefined
                 * @memberOf hs.layermanager.controller
                 * @param {Ol.layer} layer Selected layer
                 * @description Test if layers cluster or declutter is defined
                 */
                isOptionsDefined(value) {
                    if (angular.isUndefined(value)) return;
                    else return true;
                },

                /**
                * @function Declutter
                * @memberOf hs.layermanager.controller
                * @description Set declutter of features;
                */
                declutter(newValue) {
                    if (!$scope.$ctrl.currentLayer) return;
                    let layer = $scope.olLayer();
                    if (arguments.length) {
                        if (!angular.isUndefined(layer) && (!angular.isUndefined(newValue))) {
                            layer.set('declutter', newValue);
                            vectorLayerService.declutter(newValue, layer);
                            $scope.$emit('compositions.composition_edited');
                        }
                    } else {
                        return layer.get('declutter');
                    }
                },

                /**
              * @function cluster
              * @memberOf hs.layermanager.controller
              * @description Set cluster for layer;
              */
                cluster(newValue) {
                    if (!$scope.$ctrl.currentLayer) return;
                    let layer = $scope.olLayer();
                    if (arguments.length) {
                        layer.set('cluster', newValue);
                        if (!angular.isUndefined(layer) && (!angular.isUndefined(newValue))) {
                            vectorLayerService.cluster(newValue, layer, $scope.distance.value);
                            $scope.$emit('compositions.composition_edited');
                        }
                    } else {
                        return layer.get('cluster');
                    }
                },
                /**
                * @function changeDistance
                * @memberOf hs.layermanager.controller
                * @description Set distance between cluster features;
                */
                changeDistance() {
                    if (!$scope.$ctrl.currentLayer) return;
                    let layer = $scope.olLayer();
                    if (angular.isUndefined(layer.getSource().setDistance)) return;
                    layer.getSource().setDistance($scope.distance.value);
                },
                /**
                 * @function toggleLayerRename
                 * @memberOf hs.layermanager.controller
                 * @description Toogle layer rename control on panel (through layer rename variable)
                 */
                toggleLayerRename() {
                    $scope.layer_renamer_visible = !$scope.layer_renamer_visible;
                },

                showRemoveLayerDiag(e, layer) {
                    try {
                        var $mdDialog = $injector.get('$mdDialog');

                        var confirm = $mdDialog.confirm()
                            .title('Remove layer ' + layer.title)
                            .textContent('Are you sure about layer removal?')
                            .ariaLabel('Confirm layer removal')
                            .targetEvent(e)
                            .ok('Remove')
                            .cancel('Cancel')
                            .hasBackdrop(false);

                        $mdDialog.show(confirm).then(function () {
                            $scope.removeLayer(layer.layer);
                        }, function () {
                        });
                    } catch (ex) { }
                },

                /**
                * @function opacity
                * @memberOf hs.layermanager.controller
                * @description Set selected layers opacity and emits "compositionchanged"
                */
                opacity(newValue) {
                    if (!$scope.$ctrl.currentLayer) return;
                    let layer = $scope.olLayer();
                    if (arguments.length) {
                        layer.setOpacity(newValue);
                        $scope.$emit('compositions.composition_edited');
                    }
                    else
                        return layer.getOpacity()
                },

                /**
                 * @function layerIsZoomable
                 * @memberOf hs.layermanager.controller
                 * @description Determines if layer has BoundingBox defined as 
                 * its metadata or is a Vector layer. Used for setting visibility 
                 * of 'Zoom to ' button
                 * @param {Ol.layer} layer Selected layer
                 */
                layerIsZoomable() {
                    return layerUtils.layerIsZoomable($scope.olLayer())
                },

                /**
                 * @function layerIsStyleable
                 * @memberOf hs.layermanager.controller
                 * @description Determines if layer is a Vector layer and 
                 * styleable. Used for allowing styling
                 * @param {Ol.layer} layer Selected layer
                 */
                layerIsStyleable() {
                    return layerUtils.layerIsStyleable($scope.olLayer())
                },
                /**
        * @function hasCopyright
        * @memberOf hs.layermanager.controller
        * @description Determines if layer has metadata information avaliable * 
        * @param {Ol.layer} layer Selected layer (LayMan.currentLayer)
        */
                hasMetadata(layer) {
                    if (!$scope.$ctrl.currentLayer) return;
                    else {
                        return layer.layer.get('MetadataURL') ? true : false;
                    }
                },
                /**
                 * @function hasCopyright
                 * @memberOf hs.layermanager.controller
                 * @description Determines if layer has copyright information avaliable * 
                 * @param {Ol.layer} layer Selected layer (LayMan.currentLayer)
                 */
                hasCopyright(layer) {
                    if (!$scope.$ctrl.currentLayer) return;
                    else {
                        if (layer.layer.get('Attribution')) {
                            let attr = layer.layer.get('Attribution');
                            return (attr.OnlineResource) ? true : false;
                        }
                        else { return false }
                    }
                },
                /**
                 * @function toggleMetaPanel
                 * @memberOf hs.layermanager.controller
                 * @description Toggles Additional information panel for current
                 * layer.                 * 
                 * @param {Ol.layer} layer Selected layer (LayMan.currentLayer)
                 */
                toggleMetaPanel(layer) {
                    if (layer.layer.get("metapanelActive")) {
                        layer.layer.set("metapanelActive", false);
                    }
                    else {
                        layer.layer.set("metapanelActive", true);
                    };
                },


                /**
                * @function minResolution
                * @memberOf hs.layermanager.controller
                * @description Set min resolution for selected layer 
                */
                minResolution(newValue) {
                    if (!$scope.$ctrl.currentLayer) return;
                    let layer = $scope.olLayer();
                    if (arguments.length)
                        layer.setMinResolution(newValue);
                    else
                        return layer.minResolution
                },

                /**
                * @function minResolution
                * @memberOf hs.layermanager.controller
                * @description Set max resolution for selected layer 
                */
                maxResolution(newValue) {
                    if (!$scope.$ctrl.currentLayer) return;
                    let layer = $scope.olLayer();
                    if (arguments.length)
                        layer.setMaxResolution(newValue);
                    else
                        return layer.maxResolution
                },

                /**
                * @function isLayerRemovable
                * @memberOf hs.layermanager.controller
                * @description Check if layer can be removed based on 'removable' 
                * layer attribute
                */
                isLayerRemovable() {
                    let layer = $scope.olLayer();
                    return angular.isDefined(layer)
                        && (angular.isUndefined(layer.get('removable')) || layer.get('removable') == true);
                },

                removeLayer() {
                    hsMap.map.removeLayer($scope.olLayer());
                    $rootScope.$broadcast('layermanager.updated'); //Rebuild the folder contents
                },

                saveStyle(layer) {
                    setLayerStyle(layer);
                },

                /**
                 * @function isScaleVisible
                 * @memberOf hs.layermanager.controller
                 * @param {Ol.layer} layer Selected layer
                 * @description Test if layer has min and max relolution set
                 */
                isScaleVisible() {
                    let layer = $scope.olLayer();
                    if (angular.isUndefined(layer)) return false;
                    return ($scope.minResolutionValid() || $scope.maxResolutionValid())
                },

                olLayer() {
                    if (!$scope.$ctrl.currentLayer) return undefined;
                    return $scope.$ctrl.currentLayer.layer;
                },

                minResolutionValid() {
                    let layer = $scope.olLayer();
                    if (angular.isUndefined(layer)) return false;
                    return angular.isDefined(layer.getMinResolution())
                        && layer.getMinResolution() != 0
                },

                maxResolutionValid() {
                    let layer = $scope.olLayer();
                    if (angular.isUndefined(layer)) return false;
                    return angular.isDefined(layer.getMaxResolution())
                        && layer.getMaxResolution() != Infinity
                },

                /**
                * @function isLayerWithDimensions
                * @memberOf hs.layermanager.controller
                * @description Test if layer has dimensions
                */
                isLayerWithDimensions() {
                    let layer = $scope.olLayer();
                    if (angular.isUndefined(layer)) return false;
                    if (angular.isUndefined(layer.get('dimensions'))) return false;
                    return Object.keys(layer.get('dimensions')).length > 0
                },

                dimensionChanged(dimension) {
                    $scope.$emit('layermanager.dimension_changed', {
                        layer: $scope.olLayer(),
                        dimension
                    });
                },

                dimensions() {
                    let layer = $scope.olLayer();
                    if (angular.isUndefined(layer)) return [];
                    return layer.get('dimensions');
                },

                /**
                 * @function title
                 * @memberOf hs.layermanager.controller
                 * @desription Change title of layer (Angular automatically change title in object wrapper but it is needed to manually change in Ol.layer object)
                 */
                title(newTitle) {
                    let layer = $scope.olLayer();
                    if (angular.isUndefined(layer)) return false;
                    if (arguments.length) {
                        $scope.$ctrl.currentLayer.title = newTitle;
                        layer.set('title', newTitle);
                    } else
                        return layer.get('title')
                },

                abstract(newAbstract) {
                    let layer = $scope.olLayer();
                    if (angular.isUndefined(layer)) return false;
                    if (arguments.length)
                        layer.set('abstract', newAbstract);
                    else
                        return layer.get('abstract')
                },

                expandLayer(layer) {
                    if (angular.isUndefined(layer.expanded)) layer.expanded = true;
                    else layer.expanded = !layer.expanded;
                },

                expandSettings(layer, value) {
                    if (angular.isUndefined(layer.opacity)) {
                        layer.opacity = layer.layer.getOpacity();
                    }
                    if (angular.isUndefined(layer.style) && layer.layer.getSource().styleAble) $scope.getLayerStyle(layer);
                    layer.expandSettings = value;
                },

                hasSubLayers() {
                    if ($scope.$ctrl.currentLayer == null) return;
                    var subLayers = $scope.$ctrl.currentLayer.layer.get('Layer');
                    return angular.isDefined(subLayers) && subLayers.length > 0;
                },

                getSubLayers() {
                    return subLayerService.getSubLayers();
                },

                expandFilter(layer, value) {
                    layer.expandFilter = value;
                    LayMan.currentLayer = layer;
                    $scope.currentLayer = LayMan.currentLayer;
                },

                expandInfo(layer, value) {
                    layer.expandInfo = value;
                },

                /**
                 * @function dateToNonUtc
                 * @memberOf hs.layermanager.controller
                 * @param {Date} d Date to convert
                 * @description Convert date to non Utc format
                 */
                dateToNonUtc(d) {
                    if (angular.isUndefined(d)) return;
                    var noutc = new Date(d.valueOf() + d.getTimezoneOffset() * 60000);
                    return noutc;
                }
            }),
                function setLayerStyle(wrapper) {
                    //debugger;
                    var layer = wrapper.layer;
                    var source = layer.getSource();
                    var style = wrapper.style.style;
                    if (source.hasPoly) {
                        style.setFill(new Fill({
                            color: wrapper.style.fillColor
                        }));
                    }
                    if (source.hasLine || source.hasPoly) {
                        style.setStroke(new Stroke({
                            color: wrapper.style.lineColor,
                            width: wrapper.style.lineWidth
                        }));
                    }
                    if (source.hasPoint) {
                        var image;
                        var stroke = new Stroke({
                            color: wrapper.style.pointStroke,
                            width: wrapper.style.pointWidth
                        });
                        var fill = new Fill({
                            color: wrapper.style.pointFill
                        });
                        if (wrapper.style.pointType === 'Circle') {
                            image = new Circle({
                                stroke: stroke,
                                fill: fill,
                                radius: wrapper.style.radius,
                                rotation: wrapper.style.rotation
                            });
                        }
                        if (wrapper.style.pointType === 'Polygon') {
                            image = new RegularShape({
                                stroke: stroke,
                                fill: fill,
                                radius: wrapper.style.radius,
                                points: wrapper.style.pointPoints,
                                rotation: wrapper.style.rotation
                            });
                        }
                        if (wrapper.style.pointType === 'Star') {
                            image = new RegularShape({
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
                },

                /**
                 * (PRIVATE) Get transformated extent from layer "BoundingBox" property
                 * @function getExtentFromBoundingBoxAttribute
                 * @memberOf hs.layermanager.controller
                 * @param {Ol.layer} layer Selected layer
                 */
                $scope.getExtentFromBoundingBoxAttribute = function (layer) {
                    var extent = null;
                    var bbox = layer.get("BoundingBox");
                    if (angular.isArray(bbox) && bbox.length == 4) {
                        extent = transformExtent(bbox, 'EPSG:4326', hsMap.map.getView().getProjection());
                    } else {
                        for (var ix = 0; ix < bbox.length; ix++) {
                            if (angular.isDefined(getProj(bbox[ix].crs)) || angular.isDefined(layer.getSource().getParams().FROMCRS)) {
                                var crs = bbox[ix].crs || layer.getSource().getParams().FROMCRS;
                                var b = bbox[ix].extent;
                                var first_pair = [b[0], b[1]]
                                var second_pair = [b[2], b[3]];
                                first_pair = transform(first_pair, crs, hsMap.map.getView().getProjection());
                                second_pair = transform(second_pair, crs, hsMap.map.getView().getProjection());
                                extent = [first_pair[0], first_pair[1], second_pair[0], second_pair[1]];
                                break;
                            }
                        }
                    }
                    return extent;
                },

                $scope.getLayerStyle = function (wrapper) {
                    var layer = wrapper.layer;
                    var source = layer.getSource();
                    wrapper.style = {};
                    if (angular.isUndefined(layer.getStyle)) return;
                    var style = layer.getStyle();
                    if (typeof style == 'function')
                        style = style(source.getFeatures()[0]);
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
                        if (utils.instOf(image, Circle))
                            wrapper.style.pointType = 'Circle';
                        else if (utils.instOf(image, RegularShape)) {
                            wrapper.style.pointPoints = image.getPoints();
                            wrapper.style.rotation = image.getRotation();
                            if (angular.isUndefined(image.getRadius2()))
                                wrapper.style.pointType = 'Polygon';
                            else {
                                wrapper.style.pointType = 'Star';
                                wrapper.style.radius2 = image.getRadius2();
                            }
                        }
                        if (utils.instOf(image, Circle) || utils.instOf(image, RegularShape)) {
                            wrapper.style.radius = image.getRadius();
                            wrapper.style.pointFill = image.getFill().getColor();
                            wrapper.style.pointStroke = image.getStroke().getColor();
                            wrapper.style.pointWidth = image.getStroke().getWidth();
                        }
                        if (angular.isUndefined(wrapper.style.radius2))
                            wrapper.style.radius2 = wrapper.style.radius / 2;
                        if (angular.isUndefined(wrapper.style.pointPoints))
                            wrapper.style.pointPoints = 4;
                        if (angular.isUndefined(wrapper.style.rotation))
                            wrapper.style.rotation = Math.PI / 4;
                    }
                    wrapper.style.style = style;
                }
        }]
}