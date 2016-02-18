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
            .directive('hs.statusCreator.directiveSimpleform', function() {
                return {
                    templateUrl: hsl_path + 'components/status_creator/partials/simpleform.html',
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

        .directive('hs.statusCreator.saveDialogDirective', function() {
            return {
                templateUrl: hsl_path + 'components/status_creator/partials/dialog_save.html',
                link: function(scope, element, attrs) {
                    $('#status-creator-save-dialog').modal('show');
                }
            };
        })

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

        .service('hs.status_creator.service', ['hs.map.service', 'Core', 'hs.utils.service', function(OlMap, Core, utils) {
            var me = {
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
                    json.layers = me.layers2json(map.getLayers(), $scope);

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
                 * Syntactic sugar for layer2json()
                 *
                 * @param {Object} layer Layer to be converted
                 * @param {Boolean} Whether to use pretty notation
                 * @returns {String} Text in JSON notation representing the layer
                 */
                layer2string: function(layer, pretty) {
                    var json = me.layer2json(layer);
                    var text = JSON.stringify(json, pretty);
                    return text;
                },

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
                            json.wmsMinScale = layer.get('minScale');
                            json.wmsMaxScale = layer.get('maxScale');
                            json.maxResolution = layer.getMaxResolution();
                            json.minResolution = layer.getMinResolution();
                            if (src.getUrl) json.url = encodeURIComponent(src.getUrl());
                            if (src.getUrls) json.url = encodeURIComponent(src.getUrls()[0]);
                            if (src.getProjection()) json.projection = src.getProjection().getCode().toLowerCase();
                            json.params = src.getParams();
                            json.ratio = src.get('ratio');
                            json.displayInLayerSwitcher = layer.get('show_in_manager');
                            json.metadata.styles = src.get('styles');
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
                            var f = new ol.format.GeoJSON();
                            json.features = f.writeFeatures(src.getFeatures());
                        }
                        json.maxResolution = layer.getMaxResolution();
                        json.minResolution = layer.getMinResolution();
                        json.projection = "epsg:4326";
                        if (layer.getStyle() instanceof ol.style.Style) {
                            json.style = me.serializeStyle(layer.getStyle());
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

                function generateUuid() {
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

                $scope.confirmSave = function() {
                    $.ajax({
                        url: config.status_manager_url || "/wwwlibs/statusmanager2/index.php",
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
                            if ($scope.titleFree) {
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

                $scope.selectNewTitle = function() {
                    $scope.title = $scope.guessedTitle;
                    $scope.changeTitle = true;
                }

                $scope.save = function(save_as_new) {
                    if (save_as_new || $scope.id == '') $scope.id = generateUuid();
                    $.ajax({
                        url: config.status_manager_url || "/wwwlibs/statusmanager2/index.php",
                        cache: false,
                        method: 'POST',
                        dataType: "json",
                        data: JSON.stringify({
                            data: status_creator.map2json(OlMap.map, $scope),
                            permanent: true,
                            id: $scope.id,
                            project: config.project_name,
                            request: "save"
                        }),
                        success: function(j) {
                            $scope.success = j.saved !== false;
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
                        if ((angular.isUndefined(lyr.get('show_in_manager')) || lyr.get('show_in_manager') == true) && (lyr.get('base') != true)) {
                            $scope.layers.push({
                                title: lyr.get('title'),
                                checked: true,
                                layer: lyr
                            });
                        }
                    });
                    $scope.fillGroups();
                    Core.setMainPanel('status_creator', true);
                    //$('#status-creator-dialog').modal('show');
                    $scope.loadUserDetails();
                }

                $scope.fillGroups = function() {
                    $scope.groups = [];
                    if (config.advancedForm) {
                        $.ajax({
                            url: config.status_manager_url || '/wwwlibs/statusmanager2/index.php',
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
                    if (angular.isDefined($scope.current_composition) && $scope.current_composition != "") {
                        angular.forEach($scope.groups, function(g) {
                            if (typeof $scope.current_composition.groups[g.roleName] != 'undefined') {
                                g.w = $scope.current_composition.groups[g.roleName].indexOf('w') > -1;
                                g.r = $scope.current_composition.groups[g.roleName].indexOf('r') > -1;
                            }
                        });
                    }
                }

                $scope.loadUserDetails = function() {
                    $.ajax({
                        url: config.status_manager_url + "?request=getuserinfo",
                        success: $scope.setUserDetails
                    });
                };

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


                $scope.focusTitle = function() {
                    if ($scope.guessedTitle) {
                        $scope.title = $scope.guessedTitle;
                    }
                    setTimeout(function() {
                        $('#hs-stc-title').focus();
                    }, 0);
                };

                $scope.$on('compositions.composition_loaded', function(event, data) {
                    if (console) console.log('compositions.composition_loaded', data);
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
                    }
                });

                $scope.getCurrentExtent();

                $scope.$on('map.extent_changed', function(event, data, b) {
                    $scope.getCurrentExtent()
                });
                $scope.$emit('scope_loaded', "StatusCreator");
            }
        ]);

    })
