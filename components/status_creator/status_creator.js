/**
 * @namespace hs.status_creator
 * @memberOf hs
 */
define(['angular', 'ol', 'map', 'angular-cookies'],

    function (angular, ol) {
        var module = angular.module('hs.status_creator', ['hs.map', 'hs.core', 'ngCookies'])
            /**
             * @ngdoc directive
             * @name hs.statusCreator.directive
             * @memberof hs.status_creator
             * @description Display Save map (composition) dialog
             */
            .directive('hs.statusCreator.directive', ['config', function (config) {
                return {
                    template: require('components/status_creator/partials/dialog.html')
                };
            }])
            /**
             * @ngdoc directive
             * @name hs.statusCreator.directiveForm
             * @memberof hs.status_creator
             * @description Display advanced form to collect information (metadata) about saved composition
             */
            .directive('hs.statusCreator.directiveForm', ['config', function (config) {
                return {
                    template: require('components/status_creator/partials/form.html')
                };
            }])
            /**
             * @ngdoc directive
             * @name hs.statusCreator.directiveSimpleform
             * @memberof hs.status_creator
             * @description Display simple form to collect information (metadata) about saved composition
             */
            .directive('hs.statusCreator.directiveSimpleform', ['config', function (config) {
                return {
                    template: require('components/status_creator/partials/simpleform.html')
                };
            }])
            /**
             * @ngdoc directive
             * @name hs.statusCreator.directivePanel
             * @memberof hs.status_creator
             * @description Display Save map panel in app (base directive, extended by forms)
             */
            .directive('hs.statusCreator.directivePanel', ['config', function (config) {
                return {
                    template: require(`components/status_creator/partials/panel.html`),
                };
            }])
            /**
             * @ngdoc directive
             * @name hs.statusCreator.resultDialogDirective
             * @memberof hs.status_creator
             * @description Display dialog about result of saving to status manager operation
             */
            .directive('hs.statusCreator.resultDialogDirective', ['config', function (config) {
                return {
                    template: require('components/status_creator/partials/dialog_result.html'),
                    link: function (scope, element, attrs) {
                        scope.resultModalVisible = true;
                    }
                };
            }])
            /**
             * @ngdoc directive
             * @name hs.statusCreator.saveDialogDirective
             * @memberof hs.status_creator
             * @description Display saving dialog (confirmation of saving, overwriting, selection of name)
             */
            .directive('hs.statusCreator.saveDialogDirective', ['config', function (config) {
                return {
                    template: require('components/status_creator/partials/dialog_save.html'),
                    link: function (scope, element, attrs) {
                        scope.saveCompositionModalVisible = true;
                    }
                };
            }])
            /**
             * @ngdoc directive
             * @name hs.statusCreator.focusName
             * @memberof hs.status_creator
             * @description UNUSED?
             */
            .directive('hs.statusCreator.focusName', function ($timeout) {
                return {
                    link: function (scope, element, attrs) {
                        scope.$watch(attrs.focusName, function (value) {
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
            .service('hs.status_creator.service', ['hs.map.service', 'Core', 'hs.utils.service', '$window', '$cookies', 'config', function (OlMap, Core, utils, $window, $cookies, config) {
                var me = {
                    endpointUrl(){
                        var hostName = location.protocol + '//' + location.host;
                        if(angular.isDefined(config.hostname)){
                            if (config.hostname.status_manager && config.hostname.status_manager.url){
                                return config.hostname.status_manager.url;
                            }
                            if(config.hostname.user && config.hostname.user.url){
                                hostName = config.hostname.user.url; 
                            } else if(config.hostname.default && config.hostname.default.url) {
                                hostName = config.hostname.default.url
                            }
                        }
                        return hostName + (config.status_manager_url || '/wwwlibs/statusmanager2/index.php')
                    },
                    /**
                    * Create Json object which stores information about composition, user, map state and map layers (including layer data)
                    * @memberof hs.status_creator.service
                    * @function map2json
                    * @param {Ol.map} map Selected map object
                    * @param {$scope} $scope Angular scope from which function is called
                    * @returns {Object} JSON object with all required map composition metadata
                    */
                    map2json: function (map, compoData, userData, statusData) {
                        var groups = {};
                        angular.forEach(statusData.groups, function (g) {
                            if (g.r || g.w) {
                                groups[g.roleName] = (g.r ? 'r' : '') + (g.w ? 'w' : '');
                            }
                        });
                        var json = {
                            abstract: compoData.abstract,
                            title: compoData.title,
                            keywords: compoData.keywords,
                            extent: compoData.bbox,
                            user: {
                                address: userData.address,
                                city: userData.city,
                                country: userData.country,
                                email: userData.email,
                                name: userData.name,
                                organization: userData.organization,
                                phone: userData.phone,
                                position: userData.position,
                                postalcode: userData.postalcode,
                                state: userData.state
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

                        json.layers = me.layers2json(layers, compoData.layers);
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
                    getCurrentBaseLayer: function (map) {
                        var current_base_layer = null;
                        angular.forEach(map.getLayers().getArray(), function (lyr) {
                            if ((angular.isUndefined(lyr.get('show_in_manager')) || lyr.get('show_in_manager') == true) && lyr.get('base') == true && lyr.getVisible()) {
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
                    layers2json: function (layers, layerForm) {

                        var i, ilen;
                        var json = [];
                        layers.forEach(function (lyr) {
                            if (angular.isDefined(layerForm)) {
                                //From form
                                angular.forEach(layerForm, function (list_item) {
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
                    layer2string: function (layer, pretty) {
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
                    serializeStyle: function (s) {
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
                    layer2json: function (layer) {
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
                                } catch (ex) { }
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
                    serializeFeatures: function (features) {
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
                    generateThumbnail: function ($element, localThis) {
                        if (Core.mainpanel == 'status_creator' || Core.mainpanel == 'permalink' || Core.mainpanel == "statusCreator") {
                            $element.setAttribute("crossOrigin", "Anonymous");
                            OlMap.map.once('postcompose', function (event) {
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
                                try {
                                    $element.setAttribute('src', canvas2.toDataURL('image/png'));
                                    this.thumbnail = canvas2.toDataURL('image/jpeg', 0.8);
                                }
                                catch (e) {
                                    $element.setAttribute('src', config.hsl_path + 'components/status_creator/notAvailable.png');
                                }
                                $element.style.width = width + 'px';
                                $element.style.height = height + 'px';
                            }, localThis);
                            OlMap.map.renderSync();
                        }
                    }
                };

                $window.addEventListener('beforeunload', function (event) {
                    var data = {}
                    var layers = []
                    angular.forEach(OlMap.map.getLayers(), function (layer) {
                        if (layer.get('saveState')) {
                            layers.push(me.layer2json(layer));
                        }
                    })
                    data.layers = layers;
                    $cookies.put('hs_layers', JSON.stringify(data));
                });
                return me;
            }])
            .service('hs.status_creator.managerService', ['$rootScope', 'hs.map.service', 'Core', 'hs.status_creator.service', 'config', '$http',
                function ($rootScope, OlMap, Core, status_creator, config, $http) {
                    var me = {}
                    me.compoData = {
                        title: "",
                        abstract: "",
                        keywords: [],
                        layers: [],
                        id: "",
                        thumbnail: undefined,
                        bbox: undefined,
                        currentCompositionTitle: "",
                        currentComposition: undefined
                    };
                    me.userData = {
                        email: "",
                        phone: "",
                        name: "",
                        address: "",
                        country: "",
                        postalCode: "",
                        city: "",
                        organization: "",
                    };
                    me.statusData = {
                        titleFree: undefined,
                        hasPermission: undefined,
                        success: undefined,
                        changeTitle: undefined,
                        groups: []
                    };
                    me.confirmSave = function () {
                        $http({
                            method: 'POST',
                            url: status_creator.endpointUrl(),
                            data: JSON.stringify({
                                project: config.project_name,
                                title: me.compoData.title,
                                request: 'rightToSave'
                            })
                        }).
                            then(function (response) {
                                var j = response.data;
                                me.statusData.hasPermission = j.results.hasPermission;
                                me.statusData.titleFree = j.results.titleFree
                                if (j.results.guessedTitle) {
                                    me.statusData.guessedTitle = j.results.guessedTitle;
                                }
                                if (!me.statusData.titleFree) me.statusData.changeTitle = false;
                                if (me.statusData.titleFree && me.statusData.hasPermission) {
                                    me.save(true);
                                } else {
                                    $rootScope.$broadcast('StatusManager.saveResult', 'saveConfirm');
                                }
                            }, function (err) {
                                me.statusData.success = false;
                                $rootScope.$broadcast('StatusManager.saveResult', 'saveResult', 'error');
                            });
                    };
                    me.save = function (saveAsNew) {
                        if (saveAsNew || me.compoData.id == '') me.compoData.id = status_creator.generateUuid();
                        $http({
                            url: status_creator.endpointUrl(),
                            method: 'POST',
                            data: JSON.stringify({
                                data: status_creator.map2json(OlMap.map, me.compoData, me.userData, me.statusData),
                                permanent: true,
                                id: me.compoData.id,
                                project: config.project_name,
                                thumbnail: me.compoData.thumbnail,
                                request: "save"
                            })
                        }).then(function (response) {
                            var compInfo = {};
                            var j = response.data;
                            compInfo.id = me.compoData.id;
                            compInfo.title = me.compoData.title;
                            compInfo.abstract = me.compoData.abstract || '';
                            me.status = angular.isDefined(j.saved) && (j.saved !== false);
                            $rootScope.$broadcast('compositions.composition_loading', compInfo);
                            $rootScope.$broadcast('compositions.composition_loaded', compInfo);
                            $rootScope.$broadcast('StatusManager.saveResult', 'saveResult', angular.isDefined(j.saved) && (j.saved !== false) ? 'ok' : 'not-saved');
                        }, function (err) {
                            me.statusData.success = false;
                            $rootScope.$broadcast('StatusManager.saveResult', 'saveResult', 'error');
                        });
                    };
                    /**
                     * Initialization of Status Creator from outside of component
                     * @function open
                     * @memberof hs.status_creator.controller
                     */
                    me.open = function () {
                        Core.setMainPanel('status_creator', true);
                        me.refresh();
                    };
                    me.refresh = function () {
                        me.compoData.layers = [];
                        me.compoData.bbox = me.getCurrentExtent();
                        //debugger;
                        OlMap.map.getLayers().forEach(function (lyr) {
                            if ((angular.isUndefined(lyr.get('show_in_manager')) || lyr.get('show_in_manager') == true) && (lyr.get('base') != true)) {
                                me.compoData.layers.push({
                                    title: lyr.get('title'),
                                    checked: true,
                                    layer: lyr
                                });
                            }
                        });
                        me.compoData.layers.sort(function (a, b) {
                            return a.layer.get('position') - b.layer.get('position')
                        });
                        me.fillGroups(function () {
                            me.statusData.groups.unshift({
                                roleTitle: 'Public',
                                roleName: 'guest',
                                w: false,
                                r: false
                            });
                            var cc = me.compoData.currentComposition;
                            if (angular.isDefined(me.compoData.currentComposition) && cc != "") {
                                angular.forEach(me.statusData.groups, function (g) {
                                    if (angular.isDefined(cc.groups) && angular.isDefined(cc.groups[g.roleName])) {
                                        g.w = cc.groups[g.roleName].indexOf('w') > -1;
                                        g.r = cc.groups[g.roleName].indexOf('r') > -1;
                                    }
                                });
                            }
                        });
                        me.loadUserDetails();
                    }
                    /**
                     * Send getGroups request to status manager server and process response
                     * @function fillGroups
                     * @memberof hs.status_creator.controller
                     */
                    me.fillGroups = function (cb) {
                        me.statusData.groups = [];
                        if (config.advancedForm) {
                            $http({
                                url: status_creator.endpointUrl(),
                                method: 'GET',
                                data: {
                                    request: 'getGroups'
                                }
                            }).
                                then(function (response) {
                                    var j = response.data;
                                    if (j.success) {
                                        me.statusData.groups = j.result;
                                        angular.forEach(me.statusData.groups, function (g) {
                                            g.w = false;
                                            g.r = false;
                                        });
                                    }
                                    cb();
                                }, function (err) {

                                });
                        } else {
                            cb();
                        }
                    };

                    /**
                     * Get User info from server and call callback (setUserDetail)
                     * @function loadUserDetails
                     * @memberof hs.status_creator.controller
                     */
                    me.loadUserDetails = function () {
                        //TODO: This long statement should be in function
                        $http({ url: status_creator.endpointUrl() + "?request=getuserinfo" }).
                            then(me.setUserDetails, function (err) { });
                    };

                    /**
                     * Process user info into controller model, so they can be used in Save composition forms
                     * @function setUserDetails
                     * @memberof hs.status_creator.controller
                     * @param {Object} response Http response containig user data
                     */
                    me.setUserDetails = function (response) {
                        var user = response.data;
                        if (user && user.success == true) {
                            // set the values
                            if (user.userInfo) {
                                me.userData.email = user.userInfo.email;
                                me.userData.phone = user.userInfo.phone;
                                me.userData.name = user.userInfo.firstName + " " + user.userInfo.lastName;
                            }
                            if (user.userInfo && user.userInfo.org) {
                                me.userData.address = user.userInfo.org.street;
                                me.userData.country = user.userInfo.org.state;
                                me.userData.postalcode = user.userInfo.org.zip;
                                me.userData.city = user.userInfo.org.city;
                                me.userData.organization = user.userInfo.org.name;
                            }
                        }
                    };


                    /**
                     * Get current extent of map, transform it into EPSG:4326 and save it into controller model
                     * @function getCurrentExtent
                     * @memberof hs.status_creator.controller
                     */
                    me.getCurrentExtent = function () {
                        var b = OlMap.map.getView().calculateExtent(OlMap.map.getSize());
                        var pair1 = [b[0], b[1]]
                        var pair2 = [b[2], b[3]];
                        var cur_proj = OlMap.map.getView().getProjection().getCode();
                        pair1 = ol.proj.transform(pair1, cur_proj, 'EPSG:4326');
                        pair2 = ol.proj.transform(pair2, cur_proj, 'EPSG:4326');
                        return [pair1[0].toFixed(2), pair1[1].toFixed(2), pair2[0].toFixed(2), pair2[1].toFixed(2)];
                    }

                    $rootScope.$on('StatusCreator.open', function (e) {
                        me.open();
                    });

                    $rootScope.$on('compositions.composition_loaded', function (event, data) {
                        if (angular.isUndefined(data.error)) {
                            if (data.data) {
                                me.compoData.id = data.id;
                                me.compoData.abstract = data.data.abstract;
                                me.compoData.title = data.data.title;
                                me.compoData.keywords = data.data.keywords;
                                me.compoData.currentComposition = data.data;
                            } else {
                                me.compoData.id = data.id;
                                me.compoData.abstract = data.abstract;
                                me.compoData.title = data.title;
                                me.compoData.keywords = data.keywords;
                                me.compoData.currentComposition = data;
                            }

                            me.compoData.currentCompositionTitle = me.compoData.title;
                        }
                    });

                    me.resetCompoData = function () {
                        me.compoData.id = me.compoData.abstract = me.compoData.title = me.compoData.currentCompositionTitle = me.compoData.keywords = me.compoData.currentComposition = '';
                    }

                    $rootScope.$on('core.map_reset', function (event, data) {
                        me.resetCompoData();
                    });

                    $rootScope.$on('core.mainpanel_changed', function (event) {
                        if (Core.mainpanel == 'status_creator' || Core.mainpanel == 'statusCreator') {
                            me.refresh();
                            status_creator.generateThumbnail(document.getElementById('hs-stc-thumbnail'), me.compoData);
                        }
                    });

                    $rootScope.$on('map.extent_changed', function (event) {
                        me.compoData.bbox = me.getCurrentExtent();
                        status_creator.generateThumbnail(document.getElementById('hs-stc-thumbnail'), me.compoData);
                    });

                    return me;
                }])
            /**
             * @ngdoc controller
             * @name hs.status_creator.controller
             * @memberof hs.status_creator
             */
            .controller('hs.status_creator.controller', ['$scope', 'hs.map.service', 'Core', 'hs.status_creator.service', 'config', '$compile', 'hs.status_creator.managerService',
                function ($scope, OlMap, Core, status_creator, config, $compile, StatusManager) {
                    $scope.compoData = StatusManager.compoData;
                    $scope.statusData = StatusManager.statusData;
                    $scope.userData = StatusManager.userData;
                    $scope.panel_name = 'status_creator';
                    $scope.config = config;

                    /**
                     * Callback function for clicking Next button, create download link for map context and show save, saveas buttons
                     * @function next
                     * @memberof hs.status_creator.controller
                     */
                    $scope.next = function () {
                        if ($('a[href=#author]').parent().hasClass('active')) {
                            var data = "text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(status_creator.map2json(OlMap.map, $scope.compoData, $scope.userData, $scope.statusData)));
                            $('#stc-download').remove();
                            $('<a id="stc-download" class="btn btn-secondary" href="data:' + data + '" download="context.hsl">Download</a>').insertAfter('#stc-next');
                            $('#stc-download').click(function () {
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
                    $scope.showResultDialog = function () {
                        if (document.getElementById("status-creator-result-dialog") == null) {
                            var el = angular.element('<div hs.status_creator.result_dialog_directive></span>');
                            $compile(el)($scope);
                            document.getElementById("hs-dialog-area").appendChild(el[0]);
                        } else {
                            $scope.resultModalVisible = true;
                        }
                    }

                    $scope.showSaveDialog = function () {
                        var previousDialog = document.getElementById("status-creator-save-dialog");
                        if (previousDialog)
                            previousDialog.parentNode.removeChild(previousDialog);
                        var el = angular.element('<div hs.status_creator.save_dialog_directive></span>');
                        $compile(el)($scope);
                        document.getElementById("hs-dialog-area").appendChild(el[0]);
                    }
                    /**
                     * Test if current composition can be saved (User permission, Free title of composition) and a) proceed with saving; b) display advanced save dialog; c) show result dialog, with fail message
                     * @function confirmSave
                     * @memberof hs.status_creator.controller
                     */
                    $scope.confirmSave = function () {
                        StatusManager.confirmSave();
                    }

                    $scope.save = function (saveAsNew) {
                        StatusManager.save(saveAsNew);
                    }

                    $scope.$on('StatusManager.saveResult', function (e, step, result) {
                        $scope.resultCode = result;
                        if (step === 'saveResult') {
                            $scope.showResultDialog();
                            $('#stc-next').show();
                            $('#stc-download').hide();
                            $('#stc-save, #stc-saveas').hide();
                            $('.stc-tabs li:eq(0) a').tab('show');
                            Core.setMainPanel('layermanager', true);

                            $('.composition-info').html($('<div>').html($scope.title)).click(function () {
                                $('.composition-abstract').toggle()
                            });
                            $('.composition-info').append($('<div>').html($scope.abstract).addClass('well composition-abstract'));
                        }
                        else if (step === 'saveConfirm') {
                            $scope.showSaveDialog();
                        }
                        else if (step === 'saveResult') {
                            $scope.showResultDialog();
                        }
                    })

                    /**
                     * Callback for saving with new title 
                     * @function selectNewTitle
                     * @memberof hs.status_creator.controller
                     */
                    $scope.selectNewTitle = function () {
                        $scope.compoData.title = $scope.statusData.guessedTitle;
                        $scope.changeTitle = true;
                    }
                    /**
                     * @function focusTitle
                     * @memberof hs.status_creator.controller
                     */
                    $scope.focusTitle = function () {
                        if ($scope.statusData.guessedTitle) {
                            $scope.compoData.title = $scope.statusData.guessedTitle;
                        }
                        setTimeout(function () {
                            $('#hs-stc-title').focus();
                        }, 0);
                    };

                    $scope.getCurrentExtent = function () {
                        $scope.compoData.bbox = StatusManager.getCurrentExtent();
                    }

                    $scope.$on('core.map_reset', function (event, data) {
                        $('#stc-next').show();
                        $('#stc-download').hide();
                        $('#stc-save, #stc-saveas').hide();
                        $('.stc-tabs li:eq(0) a').tab('show');
                    });

                    $scope.$on('core.mainpanel_changed', function (event) {
                        if (Core.mainpanel == 'status_creator') {
                            $('#stc-next').show();
                            $('#stc-download').hide();
                            $('#stc-save, #stc-saveas').hide();
                            $('.stc-tabs li:eq(0) a').tab('show');
                        }
                    });
                    $scope.$emit('scope_loaded', "StatusCreator");
                }
            ]);

    })
