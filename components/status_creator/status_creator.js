/**
 * @namespace hs.status_creator
 * @memberOf hs
 */
define(['angular', 'ol', 'map', 'ngcookies'],

    function(angular, ol) {
        var module = angular.module('hs.status_creator', ['hs.map', 'hs.core', 'ngCookies'])
            .directive('hs.statusCreator.directive', function() {
                return {
                    templateUrl: hsl_path + 'components/status_creator/partials/dialog.html',
                    link: function(scope, element) {
                        $('#stc-save, #stc-saveas').hide();
                    }
                };
            })
            .directive('hs.statusCreator.directiveForm', function() {
                return {
                    templateUrl: hsl_path + 'components/status_creator/partials/form.html',
                    link: function(scope, element) {

                    }
                };
            })
            .directive('hs.statusCreator.directivePanel', function() {
                return {
                    templateUrl: hsl_path + 'components/status_creator/partials/panel.html',
                    link: function(scope, element) {

                    }
                };
            })
            .directive('hs.statusCreator.resultDialogDirective', function() {
                return {
                    templateUrl: hsl_path + 'components/status_creator/partials/dialog_result.html',
                    link: function(scope, element, attrs) {
                        $('#status-creator-result-dialog').modal('show');
                    }
                };
            })

        .service('hs.status_creator.service', ['hs.map.service', 'Core', function(OlMap, Core) {
            var me = {
                map2json: function(map, $scope, saveAll) {
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
                        }
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
                    json.layers = me.layers2json(map.getLayers(), saveAll);

                    return json;
                },

                /**
                 * Converts map layers into a JSON object.
                 * Uses layer2json().
                 *
                 * @param {Array} layers Map layers that should be converted
                 * @param {Boolean} saveAll Whether all the layer attributes should be saved
                 * @returns {Array} JSON object representing the layers
                 */
                layers2json: function(layers, saveAll) {

                    var i, ilen;
                    var json = [];
                    layers.forEach(function(lyr) {
                        var l = me.layer2json(lyr, saveAll);
                        if (l) {
                            json.push(l);
                        }
                    });

                    return json;
                },

                /**
                 * Converts map layer from Layer object to text in JSON notation.
                 *
                 * Syntactic sugar for layer2json()
                 *
                 * @param {Object} layer Layer to be converted
                 * @param {Boolean} Whether to use pretty notation
                 * @param {Boolean} saveAll Whether all the layer attributes should be saved
                 * @returns {String} Text in JSON notation representing the layer
                 */
                layer2string: function(layer, pretty, saveAll) {
                    var json = me.layer2json(layer, saveAll);
                    var text = JSON.stringify(json, pretty);
                    return text;
                },

                /**
                 * Converts map layer into a JSON object.
                 *
                 * Layer properties covered:  CLASS_NAME, name, url, params,
                 *                            group, displayInLayerSwitcher, visibility,
                 *                            attribution, transitionEffect,
                 *                             isBaseLayer, minResolution,
                 *                            maxResolution, minScale, maxScale, metadata,
                 *                            abstract, opacity, singleTile, removable,
                 *                            queryable, legend, projections,
                 *                            wmsMinScale, wmsMaxScale
                 *
                 * The layer index is not covered, as we assume
                 * that it is corresponding to the layers order.
                 *
                 * @param {Object} layer Map layer that should be converted
                 * @param {Boolean} saveAll Whether all the layer attributes should be saved. Sometimes we want to save network traffic and save completely only the foreign layers, in such a case set saveAll to false.
                 * @returns {Object} JSON object representing the layer
                 */
                layer2json: function(layer, saveAll) {
                    var json = {
                        metadata: {}
                    };
                    if (!layer instanceof ol.layer.Layer) {
                        return;
                    }

                    // Check if the layer is foreigner 
                    if (layer.get('saveState')) {
                        saveAll = true; // If so, make sure we save all the attributes
                    } else {
                        return; //RB. Dont process not foreign layers
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

                    if (saveAll) {
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
                                json.wmsMinScale = layer.get('minScale');
                                json.wmsMaxScale = layer.get('maxScale');
                                json.maxResolution = layer.getMaxResolution();
                                json.minResolution = layer.getMinResolution();
                                if (src.getUrl) json.url = src.getUrl();
                                if (src.getUrls) json.url = src.getUrls()[0];
                                if (src.getProjection()) json.projection = src.getProjection().getCode().toLowerCase();
                                json.params = src.getParams();
                                json.ratio = src.get('ratio');
                                json.displayInLayerSwitcher = layer.get('show_in_manager');
                                json.metadata.styles = src.get('styles');
                            }
                        }

                        // Vector 
                        if (layer instanceof ol.layer.Vector) {
                            /* RB. Will be implemented later
                             *this._saveVectorLayer(json, layer);
                             */
                        }

                        // image
                        if (layer instanceof ol.layer.Image) {
                            /* RB. Will be implemented later
                             * this._saveImageLayer(json, layer);
                             */
                        }
                    }

                    return json;
                }
            };
            return me;
        }])

        .controller('hs.status_creator.controller', ['$scope', '$rootScope', 'hs.map.service', 'Core', 'hs.status_creator.service', 'config', '$compile', '$cookies',
            function($scope, $rootScope, OlMap, Core, status_creator, config, $compile, $cookies) {
                $scope.layers = [];
                $scope.id = '';
                $scope.panel_name = 'status_creator';

                $scope.getCurrentExtent = function() {
                    var b = OlMap.map.getView().calculateExtent(OlMap.map.getSize());
                    var pair1 = [b[0], b[1]]
                    var pair2 = [b[2], b[3]];
                    var cur_proj = OlMap.map.getView().getProjection().getCode();
                    pair1 = ol.proj.transform(pair1, cur_proj, 'EPSG:4326');
                    pair2 = ol.proj.transform(pair2, cur_proj, 'EPSG:4326');
                    $scope.bbox = [pair1[0].toFixed(8), pair1[1].toFixed(8), pair2[0].toFixed(8), pair2[1].toFixed(8)];
                }

                $scope.next = function() {
                    if ($('a[href=#author]').parent().hasClass('active')) {
                        var data = "text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(status_creator.map2json(OlMap.map, $scope, false)));
                        $('#stc-download').remove();
                        $('<a id="stc-download" class="btn btn-default" href="data:' + data + '" download="context.hsl">Download</a>').insertAfter('#stc-next');
                        $('#stc-save, #stc-saveas').show();
                    } else {
                        $('.stc-tabs li:eq(1) a').tab('show');
                    }
                }

                var generateUuid = function() {
                    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                        var r = Math.random() * 16 | 0,
                            v = c == 'x' ? r : r & 0x3 | 0x8;
                        return v.toString(16);
                    });
                };

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

                $scope.save = function(save_as_new) {
                    if (save_as_new || $scope.id == '') $scope.id = generateUuid();
                    $.ajax({
                        url: "/wwwlibs/statusmanager2/index.php",
                        cache: false,
                        method: 'POST',
                        dataType: "json",
                        data: JSON.stringify({
                            data: status_creator.map2json(OlMap.map, $scope, false),
                            permanent: true,
                            id: $scope.id,
                            project: config.project_name,
                            request: "save"
                        }),
                        success: function(j) {
                            $scope.success = j.saved !== false;
                            $scope.showResultDialog();
                        },
                        error: function() {
                            $scope.success = false;
                            $scope.showResultDialog()
                        }
                    })
                }

                $scope.open = function() {
                    $scope.layers = [];
                    $scope.getCurrentExtent();
                    OlMap.map.getLayers().forEach(function(lyr) {
                        $scope.layers.push({
                            title: lyr.get('title'),
                            checked: lyr.get('saveState')
                        });
                    });
                    Core.setMainPanel('status_creator', true);
                    //$('#status-creator-dialog').modal('show');
                    $scope.loadUserDetails();
                }

                $scope.loadUserDetails = function() {
                    var jsessionid = $cookies.get("JSESSIONID");
                    if (jsessionid) {
                        $.ajax({
                            url: "/g4i-portlet/service/sso/validate/" + jsessionid,
                            success: $scope.setUserDetails
                        });
                    }
                };

                $scope.setUserDetails = function(user) {
                    if (user && user.resultCode == "0") {
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

                $scope.$on('compositions.composition_loaded', function(event, data) {
                    if (console) console.log('compositions.composition_loaded', data);
                    $scope.id = data.id;
                    $scope.abstract = data.abstract;
                    $scope.title = data.title;
                    $scope.keywords = data.keywords;
                });


                $scope.getCurrentExtent();
                $scope.$emit('scope_loaded', "StatusCreator");
            }
        ]);

    })
