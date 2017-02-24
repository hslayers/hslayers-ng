/**
 * @namespace hs.query
 * @memberOf hs
 */
define(['angular', 'ol', 'map', 'core', 'angular-sanitize'],

    function(angular, ol) {
        angular.module('hs.query', ['hs.map', 'hs.core', 'ngSanitize'])
            
            /**
            * @ngdoc directive
            * @name hs.query.directiveInfopanel
            * @memberOf hs.query
            * @description Display Infopanel with query results
            */
            .directive('hs.query.directiveInfopanel', ['config', function(config) {
                return {
                    templateUrl: config.infopanel_template || hsl_path + 'components/query/partials/infopanel.html?bust=' + gitsha
                };
            }])
        
            /**
            * @ngdoc directive
            * @name hs.query.infovalue
            * @memberOf hs.query
            * @description Todo
            */
            .directive('hs.query.infovalue', ['$compile', function($compile) {

                function link(scope, element, attrs) {
                    if (attrs.attribute == 'hstemplate') return;
                    if (attrs.template) {
                        var el = angular.element('<span ' + attrs.template + '></span>');
                        el.attr({
                            attribute: attrs.attribute,
                            value: attrs.value
                        });
                        element.append(el);
                        $compile(el)(scope);
                    } else {
                        if (attrs.value) {
                            if (attrs.value.indexOf('http') == 0) {
                                var el = angular.element('<a>');
                                el.attr({
                                    target: '_blank',
                                    href: attrs.value
                                });
                                el.html(attrs.value);
                                element.html(el);
                            } else {
                                element.html(attrs.value);
                            }
                        } else {
                            element.html(attrs.attribute);
                        }
                    }
                }

                return {
                    link: link
                };
            }])
        
            /**
            * @ngdoc service
            * @name hs.query.service_getwmsfeatureinfo
            * @memberOf hs.query
            * @description Service for handling WMS GetFeatureInfo requests 
            */
            .service('hs.query.service_getwmsfeatureinfo', ['hs.utils.service',
                function(utils) {
                    /**
                    * @function request
                    * @memberOf hs.query.service_getwmsfeatureinfo
                    * @params {String} url Complete Url of GetFeatureInfo request
                    * @params {String} info_format Expected info_format, necessary for automated response handling
                    * @params {Ol.coordinate} coordinate Coordinate of feature to Get info
                    * Send GetFeatureInfo request to selected url and push response data on success to response handler.
                    */
                    this.request = function(url, info_format, coordinate) {                    
                        var req_url = utils.proxify(url);
                        var me = this;
                        $.ajax({
                            url: req_url,
                            cache: false,
                            success: function(response) {
                                me.featureInfoReceived(response, info_format, url, coordinate)
                            }
                        });
                    };

                }
            ])
        
            /**
            * @ngdoc service
            * @name hs.query.service_infopanel
            * @memberOf hs.query
            * @description Keep and update information for displaying inside Info Panel. Use two variables for storing - groups (for classic info from WMS or vectors) and attributes (tool spcific info, e.g. lodexplorer)
            */
            .service("hs.query.service_infopanel", ['$rootScope',
                function($rootScope) {
                    var me = {
                        //Used for tool specific info, such as lodexplorer region names and values
                        attributes: [],
                        //Used for getfeatureinfo. There exists a seperate group for each feature which is found at the specific coordinates
                        groups: [],
                        /**
                        * @function setAttributes
                        * @memberof hs.query.service_infopanel
                        * @params {Object} j New content
                        * Rewrite content of attributes variable with passed data
                        */
                        setAttributes: function(j) {
                            me.attributes = j;
                            $rootScope.$broadcast('infopanel.updated');
                        },
                        /**
                        * @function setGroups
                        * @memberof hs.query.service_infopanel
                        * @params {Object} j New content
                        * Rewrite content of groups variable with passed data
                        */
                        setGroups: function(j) {
                            me.groups = j;
                            $rootScope.$broadcast('infopanel.updated');
                        },
                        enabled: true
                    };

                    return me;
                }
            ])

        /**
        * @ngdoc controller
        * @name hs.query.controller
        * @memberOf hs.query
        */
        .controller('hs.query.controller', ['$scope', 'hs.map.service', 'hs.query.service_getwmsfeatureinfo', 'hs.query.service_infopanel', 'Core', '$sce',
            function($scope, OlMap, WmsGetFeatureInfo, InfoPanelService, Core, $sce) {
                var map = OlMap.map;
                var point_clicked = new ol.geom.Point([0, 0]);
                var lyr = null;

                //For vector layers use this to get the selected features
                var selector = new ol.interaction.Select({
                    condition: ol.events.condition.click
                });

                var vectors_selected = false;
                
                selector.getFeatures().on('add', function(e) {
                    //if (e.element.getKeys().length == 1) e.target.remove(e.element);
                    InfoPanelService.groups = []; // We can do this, because collection add is called before singleclick event
                    if (!Core.current_panel_queryable || !InfoPanelService.enabled) return;
                    $scope.$broadcast('infopanel.feature_selected', e.element, selector);
                    if (e.element.get('hs_notqueryable')) return;
                    getFeatureAttributes(e.element);
                });

                selector.getFeatures().on('remove', function(e) {
                    if (!Core.current_panel_queryable || !InfoPanelService.enabled) return;
                    InfoPanelService.setAttributes([]);
                    $scope.$broadcast('infopanel.feature_deselected', e.element);
                })

                /**
                * @function getFeatureAttributes
                * @memberOf hs.query.controller
                * @params {Object} feature Selected feature from map
                * (PRIVATE) Handler for querying vector layers of map. Get information about selected feature.
                */
                var getFeatureAttributes = function(feature) {
                    if (!Core.current_panel_queryable) return;
                    var attributes = [];
                    var groups_added = false;
                    feature.getKeys().forEach(function(key) {
                        if (key == 'gid' || key == 'geometry') return;
                        if (key == "features") {
                            for (var sub_feature in feature.get('features')) {
                                var hstemplate = null;
                                if (feature.get('features')[sub_feature].get('hstemplate')) hstemplate = feature.get('features')[sub_feature].get('hstemplate');
                                var group = {
                                    name: "Feature",
                                    attributes: [],
                                    hstemplate: hstemplate
                                };
                                feature.get('features')[sub_feature].getKeys().forEach(function(key) {
                                    if (key == 'gid' || key == 'geometry') return;
                                    if ((typeof feature.get('features')[sub_feature].get(key)).toLowerCase() == "string") {
                                        group.attributes.push({
                                            name: key,
                                            value: $sce.trustAsHtml(feature.get('features')[sub_feature].get(key))
                                        });
                                    } else {
                                        group.attributes.push({
                                            name: key,
                                            value: feature.get('features')[sub_feature].get(key)
                                        });
                                    }
                                })
                                groups_added = true;
                                InfoPanelService.groups.push(group);
                            }
                        } else {
                            var obj
                            if ((typeof feature.get(key)).toLowerCase() == "string") {
                                obj = {
                                    name: key,
                                    value: $sce.trustAsHtml(feature.get(key))
                                };
                            } else {
                                obj = {
                                    name: key,
                                    value: feature.get(key)
                                };
                            }
                            attributes.push(obj)
                        };
                    })
                    Core.setMainPanel("info");
                    //InfoPanelService.setAttributes(attributes);
                    InfoPanelService.feature = feature;
                    if (groups_added) InfoPanelService.setGroups(InfoPanelService.groups);
                    vectors_selected = true;
                }

                /**
                * @function featureInfoReceived
                * @memberOf hs.query.service_getwmsfeatureinfo
                * @params {Object} response Response of GetFeatureInfoRequest
                * @params {String} info_format Format of GetFeatureInfoResponse
                * @params {String} url Url of request 
                * @params {Ol.coordinate object} coordinate Coordinate of request
                * Parse Information from GetFeatureInfo request. If result came in xml format, Infopanel data are updated. If response is in html, popup window is updated and shown.
                */
                WmsGetFeatureInfo.featureInfoReceived = function(response, info_format, url, coordinate) {
                    /* Maybe this will work in future OL versions
                     *
                     * var format = new ol.format.GML();
                     *  console.log(format.readFeatures(response, {}));
                     */

                    //                    var x2js = new X2JS();
                    //                  var json = x2js.xml_str2json(response);
                    var something_updated = false;
                    if (info_format.indexOf("xml") > 0 || info_format.indexOf("gml") > 0) {
                        $("featureMember", response).each(function() {
                            var feature = $(this)[0].firstChild;
                            var group = {
                                name: "Feature",
                                attributes: []
                            };

                            for (var attribute in feature.children) {
                                if (feature.children[attribute].childElementCount == 0) {
                                    group.attributes.push({
                                        "name": feature.children[attribute].localName,
                                        "value": feature.children[attribute].innerHTML
                                    });
                                    something_updated = true;
                                }
                            }
                            if (something_updated)
                                InfoPanelService.groups.push(group);
                        });
                        $("msGMLOutput", response).each(function() {
                            for (var layer_i in $(this)[0].children) {
                                var layer = $(this)[0].children[layer_i];
                                var layer_name = "";
                                if (typeof layer.children == 'undefined') continue;
                                for (var feature_i = 0; feature_i < layer.children.length; feature_i++) {
                                    var feature = layer.children[feature_i];
                                    if (feature.nodeName == "gml:name") {
                                        layer_name = feature.innerHTML;
                                    } else {
                                        var group = {
                                            name: layer_name + " Feature",
                                            attributes: []
                                        };

                                        for (var attribute in feature.children) {
                                            if (feature.children[attribute].childElementCount == 0) {
                                                group.attributes.push({
                                                    "name": feature.children[attribute].localName,
                                                    "value": feature.children[attribute].innerHTML
                                                });
                                                something_updated = true;
                                            }
                                        }
                                        if (something_updated)
                                            InfoPanelService.groups.push(group);
                                    }

                                }
                            }
                        })
                        if (something_updated) {
                            InfoPanelService.setGroups(InfoPanelService.groups);
                            Core.setMainPanel("info");
                        }
                    }

                    if (info_format.indexOf("html") > 0) {
                        if (response.length <= 1) return;
                        fillIframeAndResize($("#invisible_popup"), response, true);
                        createFeatureInfoPopupIfNeeded(coordinate);
                        $(popup.getElement()).popover('show');
                        $(popup.getElement()).on('shown.bs.popover', function() {
                            fillIframeAndResize($('.getfeatureinfo_popup'), $("#invisible_popup").contents().find('body').html(), false);
                            $('.close', popup.getElement().nextElementSibling).click(function() {
                                $(popup.getElement()).popover('hide');
                            });
                            popup.setPosition(coordinate);
                            panIntoView(coordinate);
                            $(popup.getElement()).off('shown.bs.popover');
                        })
                    }
                }

                /**
                * @function fillIframeAndResize
                * @memberOf hs.query.controller
                * @params {JQuery object} $iframe Selected element to fill
                * @params {TODO} response TODO
                * @params {Boolean} append Whether add html code to element (true) or complety replace element content (false)
                * (PRIVATE) Fill popover iframe with correct content a resize element to fit content (with maximal size 720 x 700 px)
                */
                function fillIframeAndResize($iframe, response, append) {
                    if (append)
                        $iframe.contents().find('body').append(response);
                    else
                        $iframe.contents().find('body').html(response);
                    var tmp_width = $iframe.contents().innerWidth();
                    if (tmp_width > $("#map").width() - 60 ) tmp_width = $("#map").width() - 60;
                    $iframe.width(tmp_width);
                    if ($iframe.width() == 20) $iframe.width(270);
                    var tmp_height = $iframe.contents().innerHeight();
                    if (tmp_height > 700) tmp_height = 700;
                    $iframe.height(tmp_height);
                }

                var popup = null;

                /**
                * @function createFeatureInfoPopupIfNeeded
                * @memberOf hs.query.controller
                * @params {Object} coordinate Position for displaying popup
                * (PRIVATE) (re)Create popup Overlay for displaying Info.
                */
                function createFeatureInfoPopupIfNeeded(coordinate) {
                    if ($('.getfeatureinfo_popup').length > 0) {
                        $(popup.getElement()).popover('destroy');
                        OlMap.map.removeOverlay(popup);
                    }
                    var pop_div = document.createElement('div');
                    var element, content;
                    var width = $("#invisible_popup").width();
                    var height = $("#invisible_popup").height();
                    var close_button = '<button type="button" class="close"><span aria-hidden="true">×</span><span class="sr-only" translate>Close</span></button>';

                    document.getElementsByTagName('body')[0].appendChild(pop_div);
                    popup = new ol.Overlay({
                        element: pop_div,
                        positioning: 'bottom-center'
                    });
                    element = popup.getElement();
                    OlMap.map.addOverlay(popup);
                    content = close_button + '<iframe class="getfeatureinfo_popup" width=' + width + ' height=' + height + ' style="border:0"></iframe>';
                    $(element).popover({
                        'placement': 'top',
                        'animation': true,
                        'html': true,
                        'content': content
                    });
                    $(element).popover('show');
                    popup.setPosition(coordinate);
                }

                /**
                * @function panIntoView
                * @memberOf hs.query.controller
                * @params {Object} coord
                * (PRIVATE) Move view to fit popup into view.
                */
                function panIntoView(coord) {
                    var popSize = {
                            width: $(".getfeatureinfo_popup").width(),
                            height: $(".getfeatureinfo_popup").height() + 70
                        },
                        mapSize = OlMap.map.getSize();
                    
                    var tailHeight = 20;
                    var border = popSize.width / 2;
                    
                    var popOffset = popup.getOffset(),
                        popPx = OlMap.map.getPixelFromCoordinate(coord);
                    
                    var leftOverflow = popPx[0] - border,
                        rightOverflow = mapSize[0] - (popPx[0] + border);
                    
                    var fromTop = popPx[1] - popSize.height + popOffset[1],
                        fromBottom = mapSize[1] - (popPx[1] + tailHeight) - popOffset[1];
                    
                    var center = OlMap.map.getView().getCenter(),
                        curPx = OlMap.map.getPixelFromCoordinate(center),
                        newPx = curPx.slice();
                    
                    if (leftOverflow < 0) {
                        newPx[0] += (leftOverflow - 10);
                    }
                    
                    if (fromTop < 0) {
                        newPx[1] += fromTop;
                    } else if (fromBottom < 0) {
                        newPx[1] -= fromBottom;
                    }

                    if (newPx[0] !== curPx[0] || newPx[1] !== curPx[1]) {
                        OlMap.map.getView().setCenter(OlMap.map.getCoordinateFromPixel(newPx));
                    }
                    
                    return;

                };


                $scope.InfoPanelService = InfoPanelService;

                //Example: displayGroupWithAttributes({name: "My group", attributes: [{name:"foo", value:"bar"}]
                /**
                * @function displayGroupWithAttributes
                * @memberOf hs.query.controller
                * @params {Object} group Data to add into attributes
                * Add passed data into InfoPanel service attribute variable
                */
                $scope.displayGroupWithAttributes = function(group) {
                    InfoPanelService.groups.push(group);
                    if (!$scope.$$phase) $scope.$digest();
                }

                /**
                * @function showCoordinate
                * @memberOf hs.query.controller
                * @params {Ol.coordinate} coordinate Coordinate of click
                * @params {Boolean} clear Choice if rewrite group variable (true) or append to group variable (false)
                * Add Coordinate data of querried point into InfoPanel service Group variable
                */
                $scope.showCoordinate = function(coordinate, clear) {
                    point_clicked.setCoordinates(coordinate, 'XY');
                    var groups = clear ? [] : InfoPanelService.groups;
                    groups.push({
                        name: "Coordinates",
                        attributes: [{
                            "name": "EPSG:4326",
                            "value": ol.coordinate.toStringHDMS(ol.proj.transform(coordinate, 'EPSG:3857', 'EPSG:4326'))
                        }, {
                            "name": "EPSG:3857",
                            "value": ol.coordinate.createStringXY(7)(coordinate)
                        }]
                    });
                    InfoPanelService.setGroups(groups);
                }

                /**
                * @function isLayerQueriable
                * @memberOf hs.query.controller
                * @params {Ol.layer} layer Layer to test
                * (PRIVATE) Test if selected layer is Queriable (Possible for TileWMS and ImageWMS ol.source) 
                */
                var isLayerQueriable = function(layer) {
                    if (layer instanceof ol.layer.Tile &&
                        layer.getSource() instanceof ol.source.TileWMS &&
                        layer.getSource().getParams().INFO_FORMAT) return true;
                    if (layer instanceof ol.layer.Image &&
                        layer.getSource() instanceof ol.source.ImageWMS &&
                        layer.getSource().getParams().INFO_FORMAT) return true;
                    return false;
                }

                /**
                * @function queryWmsLayer
                * @memberOf hs.query.controller
                * @params {Ol.Layer} layer Layer to Query
                * @params {Ol.coordinate} coordinate
                * Get FeatureInfo from WMS queriable layer (only if format of response is XML/GML/HTML). Use hs.query.service_getwmsfeatureinfo service for request and parsing response.
                */
                $scope.queryWmsLayer = function(layer, coordinate) {
                    if (isLayerQueriable(layer)) {
                        var source = layer.getSource();
                        var viewResolution = map.getView().getResolution();
                        var url = source.getGetFeatureInfoUrl(
                            coordinate, viewResolution, source.getProjection() ? source.getProjection() : map.getView().getProjection(), {
                                'INFO_FORMAT': source.getParams().INFO_FORMAT
                            });
                        if (url) {
                            if (console) console.log(url);
                            if (source.getParams().INFO_FORMAT.indexOf('xml') > 0 || source.getParams().INFO_FORMAT.indexOf('html') > 0 || source.getParams().INFO_FORMAT.indexOf('gml') > 0) {
                                WmsGetFeatureInfo.request(url, source.getParams().INFO_FORMAT, coordinate);
                            }
                        }
                    }
                }

                /**
                * @function activateFeatureQueries
                * @memberOf hs.query.controller
                * Activate query interaction on the map
                */
                $scope.activateFeatureQueries = function() {
                    map.addInteraction(selector);
                }

                /**
                * @function clearInfoPanel
                * @memberOf hs.query.controller
                * Clears saved data for infopanel
                */
                $scope.clearInfoPanel = function() {
                    InfoPanelService.attributes = [];
                    InfoPanelService.setGroups([]);
                }

                $scope.activateFeatureQueries();

                $scope.$on('infopanel.updated', function(event) {
                    if (!$scope.$$phase) $scope.$digest();
                });

                /**
                * @function createCurrentPointLayer
                * @memberOf hs.query.controller
                * Create new point layer for storing queried point, clean old layer and add it to map    
                */
                $scope.createCurrentPointLayer = function() {
                    if (lyr) map.getLayers().remove(lyr);
                    lyr = new ol.layer.Vector({
                        title: "Point clicked",
                        source: new ol.source.Vector({
                            features: [new ol.Feature({
                                geometry: point_clicked
                            })]
                        }),
                        show_in_manager: false
                    });
                    map.addLayer(lyr);
                }

                $scope.$on('layermanager.updated', function(event, data) {
                    if (data == lyr) return; //Otherwise stack overflow
                    $scope.createCurrentPointLayer();
                });

                $scope.$on('infopanel.feature_select', function(event, feature) {
                    selector.getFeatures().clear();
                    selector.getFeatures().push(feature);
                })

                $scope.createCurrentPointLayer();

                //For wms layers use this to get the features at mouse coordinates
                map.on('singleclick', function(evt) {
                    $scope.$emit('map_clicked', evt);
                    if (!Core.current_panel_queryable || !InfoPanelService.enabled) return;
                    if (['layermanager', '', 'permalink'].indexOf(Core.mainpanel) >= 0) Core.setMainPanel("info");
                    $("#invisible_popup").contents().find('body').html('');
                    $("#invisible_popup").height(200).width(200);
                    $scope.showCoordinate(evt.coordinate, !vectors_selected); //Clear the previous content if no vector feature was selected, because otherwise it would already be cleared there
                    map.getLayers().forEach(function(layer) {
                        $scope.queryWmsLayer(layer, evt.coordinate)
                    });
                    vectors_selected = false;
                });
                $scope.$emit('scope_loaded', "Query");
            }
        ]);

    })
