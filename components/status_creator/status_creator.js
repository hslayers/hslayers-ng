/**
 * @namespace hs.status_creator
 * @memberOf hs
 */
define(['angular', 'ol', 'map', 'ngcookies'],

    function(angular, ol) {
        var module = angular.module('hs.status_creator', ['hs.map', 'hs.core', 'ngCookies'])
            /**
             * @ngdoc directive
             * @name hs.statusCreator.directive
             * @memberof hs.status_creator
             * @description Display Save map (composition) dialog
             */
            .directive('hs.statusCreator.directive', function() {
                return {
                    templateUrl: hsl_path + 'components/status_creator/partials/dialog.html?bust=' + gitsha,
                    link: function(scope, element) {
                        $('#stc-save, #stc-saveas').hide();
                    }
                };
            })
            /**
             * @ngdoc directive
             * @name hs.statusCreator.directiveForm
             * @memberof hs.status_creator
             * @description Display advanced form to collect information (metadata) about saved composition
             */
            .directive('hs.statusCreator.directiveForm', function() {
                return {
                    templateUrl: hsl_path + 'components/status_creator/partials/form.html?bust=' + gitsha,
                    link: function(scope, element) {

                    }
                };
            })
            /**
             * @ngdoc directive
             * @name hs.statusCreator.directiveSimpleform
             * @memberof hs.status_creator
             * @description Display simple form to collect information (metadata) about saved composition
             */
            .directive('hs.statusCreator.directiveSimpleform', function() {
                return {
                    templateUrl: hsl_path + 'components/status_creator/partials/simpleform.html?bust=' + gitsha,
                    link: function(scope, element) {

                    }
                };
            })
            /**
             * @ngdoc directive
             * @name hs.statusCreator.directivePanel
             * @memberof hs.status_creator
             * @description Display Save map panel in app (base directive, extended by forms)
             */
            .directive('hs.statusCreator.directivePanel', function() {
                return {
                    templateUrl: hsl_path + 'components/status_creator/partials/panel.html?bust=' + gitsha,
                    link: function(scope, element) {

                    }
                };
            })
            /**
             * @ngdoc directive
             * @name hs.statusCreator.resultDialogDirective
             * @memberof hs.status_creator
             * @description Display dialog about result of saving to status manager operation
             */
            .directive('hs.statusCreator.resultDialogDirective', function() {
                return {
                    templateUrl: hsl_path + 'components/status_creator/partials/dialog_result.html?bust=' + gitsha,
                    link: function(scope, element, attrs) {
                        $('#status-creator-result-dialog').modal('show');
                    }
                };
            })
            /**
             * @ngdoc directive
             * @name hs.statusCreator.saveDialogDirective
             * @memberof hs.status_creator
             * @description Display saving dialog (confirmation of saving, overwriting, selection of name)
             */
            .directive('hs.statusCreator.saveDialogDirective', function() {
                return {
                    templateUrl: hsl_path + 'components/status_creator/partials/dialog_save.html?bust=' + gitsha,
                    link: function(scope, element, attrs) {
                        $('#status-creator-save-dialog').modal('show');
                    }
                };
            })
            /**
             * @ngdoc directive
             * @name hs.statusCreator.focusName
             * @memberof hs.status_creator
             * @description UNUSED?
             */
            .directive('hs.statusCreator.focusName', function($timeout) {
                return {
                    link: function(scope, element, attrs) {
                        scope.$watch(attrs.focusName, function(value) {
                            if (value === true) {
                                console.log('value=', value);
                                element[0].focus();
                                scope[attrs.focusName] = false;
                                //});
                            }
                        });
                    }
                };
            })
            /**
             * @ngdoc service
             * @name hs.status_creator.service
             * @memberof hs.status_creator
             * @description Service for converting composition and composition data into JSON object which can be saved on server
             */
            .service('hs.status_creator.service', ['hs.map.service', 'Core', 'hs.utils.service', '$window', '$cookies', function(OlMap, Core, utils, $window, $cookies) {
                var me = {
                    /**
                    * Create Json object which stores information about composition, user, map state and map layers (including layer data)
                    * @memberof hs.status_creator.service
                    * @function map2json
                    * @param {Ol.map} map Selected map object
                    * @param {$scope} $scope Angular scope from which function is called
                    * @returns {Object} JSON object with all required map composition metadata
                    */
                    map2json: function(map, $scope) {
                        var groups = {};
                        angular.forEach($scope.groups, function(g) {
                            if (g.r || g.w) {
                                groups[g.roleName] = (g.r ? 'r' : '') + (g.w ? 'w' : '');
                            }
                        });
                        var json = {
                            abstract: $scope.abstract,
                            title: $scope.title,
                            keywords: $scope.keywords,
                            extent: $scope.bbox,
                            user: {
                                address: $scope.address,
                                city: $scope.city,
                                country: $scope.country,
                                email: $scope.email,
                                name: $scope.name,
                                organization: $scope.organization,
                                phone: $scope.phone,
                                position: $scope.position,
                                postalcode: $scope.postalcode,
                                state: $scope.state,
                                url: $scope.url
                            },
                            groups: groups
                        };

                        // Map properties
                        json.scale = map.getView().getProjection().getMetersPerUnit();
                        json.projection = map.getView().getProjection().getCode().toLowerCase();
                        var center = map.getView().getCenter();
                        if (center) {
                            json.center = [center[0], center[1]];
                        }
                        json.units = map.getView().getProjection().getUnits();

                        if (map.maxExtent) {
                            json.maxExtent = {};
                            json.maxExtent.left = map.maxExtent.left;
                            json.maxExtent.bottom = map.maxExtent.bottom;
                            json.maxExtent.right = map.maxExtent.right;
                            json.maxExtent.top = map.maxExtent.top;
                        }

                        //json.minResolution = map.minResolution;
                        //json.maxResolution = map.maxResolution;
                        //json.numZoomLevels = map.numZoomLevels;

                        //json.resolutions = map.resolutions;
                        //json.scales = map.scales;
                        //json.sphericalMercator = map.sphericalMercator;


                        // Layers properties
                        var layers = map.getLayers().getArray();

                        json.layers = me.layers2json(layers, $scope);
                        json.current_base_layer = me.getCurrentBaseLayer(map);
                        return json;
                    },
                    
                    /**
                    * Returns object about current selected base layer
                    * @memberof hs.status_creator.service
                    * @function getCurrentBaseLayer
                    * @param {Ol.map} map Selected map object
                    * @returns {Object} Returns object with current current selected base layers title as attribute
                    */
                    getCurrentBaseLayer: function(map){
                        var current_base_layer = null;
                        angular.forEach(map.getLayers().getArray(), function(lyr){
                            if ((angular.isUndefined(lyr.get('show_in_manager')) || lyr.get('show_in_manager') == true) && lyr.get('base') == true && layer.getVisible()) {
                                current_base_layer = {
                                    title: lyr.get('title')
                                };
                            }
                        })
                        return current_base_layer;
                    },

                    /**
                     * Converts map layers into a JSON object. If $scope is defined, stores only layers checked in form
                     * Uses layer2json().
                     * @memberof hs.status_creator.service
                     * @function layer2json
                     * @param {Array} layers Map layers that should be converted
                     * @param {$scope} $scope Angular scope from which function is called
                     * @returns {Array} JSON object representing the layers
                     */
                    layers2json: function(layers, $scope) {

                        var i, ilen;
                        var json = [];
                        layers.forEach(function(lyr) {
                            if (angular.isDefined($scope)) {
                                //From form
                                angular.forEach($scope.layers, function(list_item) {
                                    if (list_item.layer == lyr && list_item.checked) {
                                        var l = me.layer2json(lyr);
                                        if (l) json.push(l);
                                    }
                                })
                            } else {
                                //From unloading
                                var l = me.layer2json(lyr);
                                if (l) json.push(l);
                            }
                        });

                        return json;
                    },

                    /**
                     * Converts map layer from Layer object to text in JSON notation.
                     *
                     * Syntactic sugar for layer2json() UNUSED?
                     * @memberof hs.status_creator.service
                     * @function layer2string
                     * @param {Object} layer Layer to be converted
                     * @param {Boolean} pretty Whether to use pretty notation
                     * @returns {String} Text in JSON notation representing the layer
                     */
                    layer2string: function(layer, pretty) {
                        var json = me.layer2json(layer);
                        var text = JSON.stringify(json, pretty);
                        return text;
                    },

                    /**
                     * Convert layer style object into JSON object, partial function of layer2style (saves Fill color, Stroke color/width, Image fill, stroke, radius, src and type)
                     * @memberof hs.status_creator.service
                     * @function serializeStyle
                     * @param {ol.style.Style} s Style to convert
                     * @returns {Object} Converted JSON object for style
                     */
                    serializeStyle: function(s) {
                        var o = {};
                        if (typeof s.getFill() != 'undefined' && s.getFill() != null)
                            o.fill = s.getFill().getColor();
                        if (typeof s.getStroke() != 'undefined' && s.getStroke() != null) {
                            o.stroke = {
                                color: s.getStroke().getColor(),
                                width: s.getStroke().getWidth()
                            };
                        }
                        if (typeof s.getImage() != 'undefined' && s.getImage() != null) {
                            var style_img = s.getImage();
                            var ima = {};
                            if (angular.isDefined(style_img.getFill) && typeof style_img.getFill() != 'undefined' && style_img.getFill() != null)
                                ima.fill = style_img.getFill().getColor();

                            if (angular.isDefined(style_img.getStroke) && typeof style_img.getStroke() != 'undefined' && style_img.getStroke() != null) {
                                ima.stroke = {
                                    color: style_img.getStroke().getColor(),
                                    width: style_img.getStroke().getWidth()
                                };
                            }

                            if (angular.isDefined(style_img.getRadius)) {
                                ima.radius = style_img.getRadius();
                            }

                            if (angular.isFunction(style_img.getSrc) && angular.isString(style_img.getSrc())) {
                                ima.src = utils.proxify(style_img.getSrc());
                            } else if (angular.isFunction(style_img.getImage) && style_img.getImage() != null) {
                                if (angular.isDefined(style_img.getImage().src))
                                    ima.src = style_img.getImage().src;
                            }

                            if (style_img instanceof ol.style.Circle)
                                ima.type = 'circle';

                            if (style_img instanceof ol.style.Icon)
                                ima.type = 'icon';

                            o.image = ima;
                        }
                        return o;
                    },

                    /**
                     * Converts map layer into a JSON object (only for ol.layer.Layer)                   
                     * Layer properties covered:  (CLASS_NAME), name, url, params,
                     *                            group, displayInLayerSwitcher, *visibility, *opacity
                     *                            attribution, transitionEffect,
                     *                             isBaseLayer, minResolution,
                     *                            maxResolution, minScale, maxScale, metadata,
                     *                            abstract, opacity, singleTile, removable,
                     *                            queryable, legend, projections,
                     *                            wmsMinScale, wmsMaxScale
                     *
                     * The layer index is not covered, as we assume
                     * that it is corresponding to the layers order.
                     * @memberof hs.status_creator.service
                     * @function layer2json
                     * @param {Object} layer Map layer that should be converted
                     * @returns {Object} JSON object representing the layer
                     */
                    layer2json: function(layer) {
                        var json = {
                            metadata: {}
                        };
                        if (!layer instanceof ol.layer.Layer) {
                            return;
                        }

                        // Common stuff

                        // type
                        //json.className = layer.CLASS_NAME;
                        //json.origClassName = layer.CLASS_NAME; // the original type

                        // options
                        json.visibility = layer.getVisible();
                        json.opacity = layer.getOpacity();
                        json.title = layer.get('title');
                        //json.index = layer.map.getLayerIndex(layer);
                        json.path = layer.get('path');

                        if (layer.getExtent()) {
                            var ex = layer.getExtent();
                            json.maxExtent = {
                                left: ex[0],
                                bottom: ex[3],
                                right: ex[2],
                                top: ex[1]
                            };
                        }

                        // HTTPRequest
                        if (layer instanceof ol.layer.Tile || layer instanceof ol.layer.Image) {
                            var src = layer.getSource();
                            if (src instanceof ol.source.ImageWMS || src instanceof ol.source.TileWMS) {
                                json.className = "HSLayers.Layer.WMS";
                                json.singleTile = src instanceof ol.source.ImageWMS;
                                json.wmsMinScale = layer.get('minScale');
                                json.wmsMaxScale = layer.get('maxScale');
                                if (layer.get('legends')) {
                                    json.legends = [];
                                    var legends = layer.get('legends');
                                    for (var i = 0; i < legends.length; i++) {
                                        json.legends.push(encodeURIComponent(legends[i]))
                                    }
                                }
                                json.maxResolution = layer.getMaxResolution();
                                json.minResolution = layer.getMinResolution();
                                if (src.getUrl) json.url = encodeURIComponent(src.getUrl());
                                if (src.getUrls) json.url = encodeURIComponent(src.getUrls()[0]);
                                if (src.getProjection()) json.projection = src.getProjection().getCode().toLowerCase();
                                json.params = src.getParams();
                                json.ratio = src.get('ratio') || src.ratio_;
                                json.displayInLayerSwitcher = layer.get('show_in_manager');
                                json.metadata.styles = src.get('styles');
                                if (layer.get('dimensions')) {
                                    json.dimensions = layer.get('dimensions');
                                }
                            }
                        }

                        // Vector
                        if (layer instanceof ol.layer.Vector) {
                            var src = layer.getSource();
                            json.className = "OpenLayers.Layer.Vector";
                            if (angular.isDefined(layer.get('definition'))) {
                                json.protocol = {
                                    url: encodeURIComponent(layer.get('definition').url),
                                    format: layer.get('definition').format
                                }
                            } else {
                                try {
                                    json.features = me.serializeFeatures(src.getFeatures());
                                } catch (ex) {}
                            }
                            if (angular.isDefined(src.defOptions)) {
                                json.defOptions = src.defOptions;
                            }
                            json.maxResolution = layer.getMaxResolution();
                            json.minResolution = layer.getMinResolution();
                            json.projection = "epsg:4326";
                            if (layer.getStyle() instanceof ol.style.Style) {
                                json.style = me.serializeStyle(layer.getStyle());
                            }
                        }
                        return json;
                    },

                    /**
                     * Convert feature array to GeoJSON string
                     * @memberof hs.status_creator.service
                     * @function serializeFeatures
                     * @param {Array} features Array of features
                     * @returns {String} GeoJSON string
                     */
                    serializeFeatures: function(features) {
                        var f = new ol.format.GeoJSON();
                        return f.writeFeatures(features);
                    },

                    /**
                     * Generate random Uuid
                     * @memberof hs.status_creator.service
                     * @function generateUuid
                     * @returns {String} Random Uuid in string format
                     */
                    generateUuid: utils.generateUuid,
                    
                    /**
                     * Create thumbnail of map view and save it into selected element
                     * @memberof hs.status_creator.service
                     * @function generateThumbnail
                     * @param {$element} $element Selected element
                     * @param {$scope} $scope Angular scope from which function was called
                     */
                    generateThumbnail: function($element, $scope) {
                        if (Core.mainpanel == 'status_creator' || Core.mainpanel == 'permalink') {
                            $element.attr("crossOrigin", "Anonymous");
                            OlMap.map.once('postcompose', function(event) {
                                var myCanvas = document.getElementById('my_canvas_id');
                                var canvas = event.context.canvas;
                                var canvas2 = document.createElement("canvas");
                                var width = 256,
                                    height = 256;
                                canvas2.style.width = width + "px";
                                canvas2.style.height = height + "px";
                                canvas2.width = width;
                                canvas2.height = height;
                                var ctx2 = canvas2.getContext("2d");
                                ctx2.drawImage(canvas, canvas.width / 2 - height / 2, canvas.height / 2 - width / 2, width, height, 0, 0, width, height);
                                $element.attr('src', canvas2.toDataURL('image/png'));
                                this.thumbnail = canvas2.toDataURL('image/jpeg', 0.8);
                                $element.width(width).height(height);
                            }, $scope);
                            OlMap.map.renderSync();
                        }
                    }
                };

                $window.addEventListener('beforeunload', function(event) {
                    var data = {}
                    var layers = []
                    angular.forEach(OlMap.map.getLayers(), function(layer) {
                        if (layer.get('saveState')) {
                            layers.push(me.layer2json(layer));
                        }
                    })
                    data.layers = layers;
                    $cookies.put('hs_layers', JSON.stringify(data));
                });
                return me;
            }])
//DUPLICATE?
        .controller('hs.status_creator.controller', ['$scope', '$rootScope', 'hs.map.service', 'Core', 'hs.status_creator.service', 'config', '$compile', '$cookies',
                function($scope, $rootScope, OlMap, Core, status_creator, config, $compile, $cookies) {
                    $scope.layers = [];
                    $scope.id = '';
                    $scope.thumbnail = null;
                    $scope.panel_name = 'status_creator';
                    $scope.current_composition_title = '';
                    $scope.config = config;

                    $scope.getCurrentExtent = function() {
                        var b = OlMap.map.getView().calculateExtent(OlMap.map.getSize());
                        var pair1 = [b[0], b[1]]
                        var pair2 = [b[2], b[3]];
                        var cur_proj = OlMap.map.getView().getProjection().getCode();
                        pair1 = ol.proj.transform(pair1, cur_proj, 'EPSG:4326');
                        pair2 = ol.proj.transform(pair2, cur_proj, 'EPSG:4326');
                        $scope.bbox = [pair1[0].toFixed(2), pair1[1].toFixed(2), pair2[0].toFixed(2), pair2[1].toFixed(2)];
                        if (!$scope.$$phase) $scope.$digest();
                    }

                    $window.addEventListener('beforeunload', function(event) {
                        var data = {}
                        var layers = []
                        angular.forEach(OlMap.map.getLayers(), function(layer) {
                            if (layer.get('saveState')) {
                                layers.push(me.layer2json(layer));
                            }
                        })
                        data.layers = layers;
                        $cookies.put('hs_layers', JSON.stringify(data));
                    });
                    return me;
                }
            ])
            /**
             * @ngdoc controller
             * @name hs.status_creator.controller
             * @memberof hs.status_creator
             */
            .controller('hs.status_creator.controller', ['$scope', '$rootScope', 'hs.map.service', 'Core', 'hs.status_creator.service', 'config', '$compile', '$cookies',
                function($scope, $rootScope, OlMap, Core, status_creator, config, $compile, $cookies) {
                    $scope.layers = [];
                    $scope.id = '';
                    $scope.thumbnail = null;
                    $scope.panel_name = 'status_creator';
                    $scope.current_composition_title = '';
                    $scope.config = config;
                    /**
                     * Get current extent of map, transform it into EPSG:4326 and save it into controller model
                     * @function getCurrentExtent
                     * @memberof hs.status_creator.controller
                     */
                    $scope.getCurrentExtent = function() {
                            var b = OlMap.map.getView().calculateExtent(OlMap.map.getSize());
                            var pair1 = [b[0], b[1]]
                            var pair2 = [b[2], b[3]];
                            var cur_proj = OlMap.map.getView().getProjection().getCode();
                            pair1 = ol.proj.transform(pair1, cur_proj, 'EPSG:4326');
                            pair2 = ol.proj.transform(pair2, cur_proj, 'EPSG:4326');
                            $scope.bbox = [pair1[0].toFixed(2), pair1[1].toFixed(2), pair2[0].toFixed(2), pair2[1].toFixed(2)];
                            if (!$scope.$$phase) $scope.$digest();
                        }
                    /**
                     * Callback function for clicking Next button, create download link for map context and show save, saveas buttons
                     * @function next
                     * @memberof hs.status_creator.controller
                     */
                    $scope.next = function() {
                            if ($('a[href=#author]').parent().hasClass('active')) {
                                var data = "text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(status_creator.map2json(OlMap.map, $scope)));
                                $('#stc-download').remove();
                                $('<a id="stc-download" class="btn btn-default" href="data:' + data + '" download="context.hsl">Download</a>').insertAfter('#stc-next');
                                $('#stc-download').click(function() {
                                    $('#stc-next').show();
                                    $('#stc-download').hide();
                                    $('#stc-save, #stc-saveas').hide();
                                    $('.stc-tabs li:eq(0) a').tab('show');
                                    Core.setMainPanel('layermanager', true);
                                })
                                $('#stc-next').hide();
                                if (Core.isAuthorized()) {
                                    $('#stc-save, #stc-saveas').show();
                                }
                            } else {
                                if ($('a[href=#context]').parent().hasClass('active'))
                                    $('.stc-tabs li:eq(1) a').tab('show');
                                else
                                if ($('a[href=#access]').parent().hasClass('active'))
                                    $('.stc-tabs li:eq(2) a').tab('show');
                            }
                        }
                    /**
                     * Show dialog about result of saving operation
                     * @function showResultDialog
                     * @memberof hs.status_creator.controller
                     */
                    $scope.showResultDialog = function() {
                            if ($("#hs-dialog-area #status-creator-result-dialog").length == 0) {
                                var el = angular.element('<div hs.status_creator.result_dialog_directive></span>');
                                $("#hs-dialog-area").append(el)
                                $compile(el)($scope);
                            } else {
                                $('#status-creator-result-dialog').modal('show');
                            }
                            if (!$scope.$$phase) $scope.$digest();
                        }
                    /**
                     * Test if current composition can be saved (User permission, Free title of composition) and a) proceed with saving; b) display advanced save dialog; c) show result dialog, with fail message
                     * @function confirmSave
                     * @memberof hs.status_creator.controller
                     */
                    $scope.confirmSave = function() {
                            $scope.title = this.title;
                            $scope.abstract = this.abstract;
                            $scope.keywords = this.keywords;

                            $.ajax({
                                url: (config.hostname.user ? config.hostname.user.url : (config.hostname.status_manager ? config.hostname.status_manager.url : config.hostname.default.url)) + (config.status_manager_url || "/wwwlibs/statusmanager2/index.php"),
                                cache: false,
                                method: 'POST',
                                async: false,
                                data: JSON.stringify({
                                    project: config.project_name,
                                    title: $scope.title,
                                    request: 'rightToSave'
                                }),
                                success: function(j) {
                                    $scope.hasPermission = j.results.hasPermission;
                                    $scope.titleFree = j.results.titleFree
                                    if (j.results.guessedTitle) {
                                        $scope.guessedTitle = j.results.guessedTitle;
                                    }
                                    if ($scope.titleFree && $scope.hasPermission) {
                                        $scope.save(true);
                                    } else {
                                        if (!$scope.$$phase) $scope.$digest();
                                        $("#hs-dialog-area #status-creator-save-dialog").remove();
                                        var el = angular.element('<div hs.status_creator.save_dialog_directive></span>');
                                        $("#hs-dialog-area").append(el)
                                        $compile(el)($scope);
                                    }
                                },
                                error: function() {
                                    $scope.success = false;
                                    $scope.showResultDialog()
                                }
                            })
                        }
                    /**
                     * Callback for saving with new title 
                     * @function selectNewTitle
                     * @memberof hs.status_creator.controller
                     */
                    $scope.selectNewTitle = function() {
                            $scope.title = $scope.guessedTitle;
                            $scope.changeTitle = true;
                        }
                    /**
                     * Save composition data on server, display result dialog
                     * @function save
                     * @memberof hs.status_creator.controller
                     * @param {Boolean} save_as_new Whether save as new composition on server (new id) or overwrite previous one
                     */
                    $scope.save = function(save_as_new) {
                            if (save_as_new || $scope.id == '') $scope.id = status_creator.generateUuid();
                            $.ajax({
                                url: (config.hostname.user ? config.hostname.user.url : (config.hostname.status_manager ? config.hostname.status_manager.url : config.hostname.default.url)) + (config.status_manager_url || "/wwwlibs/statusmanager2/index.php"),
                                cache: false,
                                method: 'POST',
                                dataType: "json",
                                data: JSON.stringify({
                                    data: status_creator.map2json(OlMap.map, $scope),
                                    permanent: true,
                                    id: $scope.id,
                                    project: config.project_name,
                                    thumbnail: $scope.thumbnail,
                                    request: "save"
                                }),
                                success: function(j) {
                                    var compInfo = {};
                                    $scope.success = angular.isDefined(j.saved) && (j.saved !== false);
                                    $scope.showResultDialog();
                                    $('#stc-next').show();
                                    $('#stc-download').hide();
                                    $('#stc-save, #stc-saveas').hide();
                                    $('.stc-tabs li:eq(0) a').tab('show');
                                    Core.setMainPanel('layermanager', true);

                                    $('.composition-info').html($('<div>').html($scope.title)).click(function() {
                                        $('.composition-abstract').toggle()
                                    });
                                    $('.composition-info').append($('<div>').html($scope.abstract).addClass('well composition-abstract'));
                                    compInfo.id = $scope.id;
                                    compInfo.title = $scope.title;
                                    compInfo.abstract = $scope.abstract || '';
                                    $rootScope.$broadcast('compositions.composition_loading', compInfo);
                                    $rootScope.$broadcast('compositions.composition_loaded', compInfo);
                                },
                                error: function() {
                                    $scope.success = false;
                                    $scope.showResultDialog()
                                }
                            })
                        }
                    /**
                     * Initialization of Status Creator from outside of component
                     * @function open
                     * @memberof hs.status_creator.controller
                     */
                    $scope.open = function() {
                            $scope.layers = [];
                            $scope.getCurrentExtent();
                            OlMap.map.getLayers().forEach(function(lyr) {
                                if ((angular.isUndefined(lyr.get('show_in_manager')) || lyr.get('show_in_manager') == true) && (lyr.get('base') != true)) {
                                    $scope.layers.push({
                                        title: lyr.get('title'),
                                        checked: true,
                                        layer: lyr
                                    });
                                }
                            });
                            $scope.layers.sort(function(a, b) {
                                return a.layer.get('position') - b.layer.get('position')
                            });
                            $scope.fillGroups();
                            Core.setMainPanel('status_creator', true);
                            //$('#status-creator-dialog').modal('show');
                            $scope.loadUserDetails();
                        }
                    /**
                     * Send getGroups request to status manager server and process response
                     * @function fillGroups
                     * @memberof hs.status_creator.controller
                     */
                    $scope.fillGroups = function() {
                            $scope.groups = [];
                            if (config.advancedForm) {
                                $.ajax({
                                    url: (config.hostname.user ? config.hostname.user.url : (config.hostname.status_manager ? config.hostname.status_manager.url : config.hostname.default.url)) + (config.status_manager_url || '/wwwlibs/statusmanager2/index.php'),
                                    cache: false,
                                    method: 'GET',
                                    async: false,
                                    dataType: 'json',
                                    data: {
                                        request: 'getGroups'
                                    },
                                    success: function(j) {
                                        if (j.success) {
                                            $scope.groups = j.result;
                                            angular.forEach($scope.groups, function(g) {
                                                g.w = false;
                                                g.r = false;
                                            });
                                        }
                                    }
                                });
                            }
                            $scope.groups.unshift({
                                roleTitle: 'Public',
                                roleName: 'guest',
                                w: false,
                                r: false
                            });
                            var cc = $scope.current_composition;
                            if (angular.isDefined($scope.current_composition) && cc != "") {
                                angular.forEach($scope.groups, function(g) {
                                    if (angular.isDefined(cc.groups) && angular.isDefined(cc.groups[g.roleName])) {
                                        g.w = cc.groups[g.roleName].indexOf('w') > -1;
                                        g.r = cc.groups[g.roleName].indexOf('r') > -1;
                                    }
                                });
                            }
                        }
                    /**
                     * Get User info from server and call callback (setUserDetail)
                     * @function loadUserDetails
                     * @memberof hs.status_creator.controller
                     */
                    $scope.loadUserDetails = function() {
                        $.ajax({
                            url: (config.hostname.user ? config.hostname.user.url : (config.hostname.status_manager ? config.hostname.status_manager.url : config.hostname.default.url)) + config.status_manager_url + "?request=getuserinfo",
                            success: $scope.setUserDetails
                        });
                    };
                    /**
                     * Process user info into controller model, so they can be used in Save composition forms
                     * @function setUserDetails
                     * @memberof hs.status_creator.controller
                     * @param {Object} user User object
                     */
                    $scope.setUserDetails = function(user) {
                        if (user && user.success == true) {
                            // set the values
                            if (user.userInfo) {
                                $scope.email = user.userInfo.email;
                                $scope.phone = user.userInfo.phone;
                                $scope.name = user.userInfo.firstName + " " + user.userInfo.lastName;
                            }
                            if (user.userInfo && user.userInfo.org) {
                                $scope.address = user.userInfo.org.street;
                                $scope.country = user.userInfo.org.state;
                                $scope.postalcode = user.userInfo.org.zip;
                                $scope.city = user.userInfo.org.city;
                                $scope.organization = user.userInfo.org.name;
                            }
                        }
                    };
                    /**
                     * @function focusTitle
                     * @memberof hs.status_creator.controller
                     */
                    $scope.focusTitle = function() {
                        if ($scope.guessedTitle) {
                            $scope.title = $scope.guessedTitle;
                        }
                        setTimeout(function() {
                            $('#hs-stc-title').focus();
                        }, 0);
                    };

                    $scope.$on('compositions.composition_loaded', function(event, data) {
                        if (angular.isUndefined(data.error)) {
                            if (data.data) {
                                $scope.id = data.id;
                                $scope.abstract = data.data.abstract;
                                $scope.title = data.data.title;
                                $scope.keywords = data.data.keywords;
                                $scope.current_composition = data.data;
                            } else {
                                $scope.id = data.id;
                                $scope.abstract = data.abstract;
                                $scope.title = data.title;
                                $scope.keywords = data.keywords;
                                $scope.current_composition = data;
                            }

                            $scope.current_composition_title = $scope.title;
                        }
                    });

                    $scope.$on('core.map_reset', function(event, data) {
                        $scope.id = $scope.abstract = $scope.title = $scope.current_composition_title = $scope.keywords = $scope.current_composition = '';
                        $('#stc-next').show();
                        $('#stc-download').hide();
                        $('#stc-save, #stc-saveas').hide();
                        $('.stc-tabs li:eq(0) a').tab('show');
                    });

                    $scope.$on('core.mainpanel_changed', function(event) {
                        if (Core.mainpanel == 'status_creator') {
                            $('#stc-next').show();
                            $('#stc-download').hide();
                            $('#stc-save, #stc-saveas').hide();
                            $('.stc-tabs li:eq(0) a').tab('show');
                            status_creator.generateThumbnail($('#hs-stc-thumbnail'), $scope);
                        }
                    });


                    $scope.$on('map.extent_changed', function(event, data, b) {
                        $scope.getCurrentExtent();
                        status_creator.generateThumbnail($('#hs-stc-thumbnail'), $scope);

                    });

                    $scope.getCurrentExtent();

                    $scope.$emit('scope_loaded', "StatusCreator");
                }
            ]);

    })
