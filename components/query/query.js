define(['angular', 'ol', 'map', 'core', 'angular-sanitize'],

    function(angular, ol) {
        angular.module('hs.query', ['hs.map', 'hs.core', 'ngSanitize'])
            .directive('infopanel', function() {
                return {
                    templateUrl: hsl_path + 'components/query/partials/infopanel.html'
                };
            })
            .directive('infovalue', ['$compile', function($compile) {

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
                                var el = angular.element('a');
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
            .service("WmsGetFeatureInfo", [
                function() {
                    this.request = function(url, info_format, coordinate) {
                        var esc_url = window.escape(url);
                        var me = this;
                        $.ajax({
                            url: "/cgi-bin/hsproxy.cgi?toEncoding=utf-8&url=" + esc_url,
                            cache: false,
                            success: function(response) {
                                me.featureInfoReceived(response, info_format, url, coordinate)
                            }
                        });
                    };

                }
            ]).service("InfoPanelService", ['$rootScope',
                function($rootScope) {
                    var me = {
                        //Used for tool specific info, such as lodexplorer region names and values
                        attributes: [],
                        //Used for getfeatureinfo. There exists a seperate group for each feature which is found at the specific coordinates
                        groups: [],
                        setAttributes: function(j) {
                            me.attributes = j;
                            $rootScope.$broadcast('infopanel.updated');
                        },
                        setGroups: function(j) {
                            me.groups = j;
                            $rootScope.$broadcast('infopanel.updated');
                        }
                    };

                    return me;
                }
            ])

        .controller('Query', ['$scope', 'OlMap', 'WmsGetFeatureInfo', 'InfoPanelService', 'Core', '$sce',
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
                    if (Core.mainpanel == 'measure') return;
                    var attributes = [];
                    var groups_added = false;
                    e.element.getKeys().forEach(function(key) {
                        if (key == 'gid' || key == 'geometry') return;
                        if (key == "features") {
                            for (var feature in e.element.get('features')) {
                                var hstemplate = null;
                                if (e.element.get('features')[feature].get('hstemplate')) hstemplate = e.element.get('features')[feature].get('hstemplate');
                                var group = {
                                    name: "Feature",
                                    attributes: [],
                                    hstemplate: hstemplate
                                };
                                e.element.get('features')[feature].getKeys().forEach(function(key) {
                                    if (key == 'gid' || key == 'geometry') return;
                                    if (typeof e.element.get('features')[feature].get(key) == "String") {
                                        group.attributes.push({
                                            name: key,
                                            value: $sce.trustAsHtml(e.element.get('features')[feature].get(key))
                                        });
                                    } else {
                                        group.attributes.push({
                                            name: key,
                                            value: e.element.get('features')[feature].get(key)
                                        });
                                    }
                                })
                                groups_added = true;
                                InfoPanelService.groups.push(group);
                            }
                        } else {
                            var obj = {
                                name: key,
                                value: $sce.trustAsHtml(e.element.get(key))
                            };
                            attributes.push(obj)
                        };
                    })
                    Core.setMainPanel("info");
                    InfoPanelService.setAttributes(attributes);
                    if (groups_added) InfoPanelService.setGroups(InfoPanelService.groups);
                    vectors_selected = true;
                })

                WmsGetFeatureInfo.featureInfoReceived = function(response, info_format, url, coordinate) {
                    /* Maybe this will work in future OL versions
                     *
                     * var format = new ol.format.GML();
                     *  console.log(format.readFeatures(response, {}));
                     */

                    //                    var x2js = new X2JS();
                    //                  var json = x2js.xml_str2json(response);
                    var something_updated = false;
                    if (info_format.indexOf("xml") > 0) {
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
                        if (something_updated) InfoPanelService.setGroups(InfoPanelService.groups);
                    }

                    if (info_format.indexOf("html") > 0) {
                        if (response.length <= 1) return;
                        createFeatureInfoPopupIfNeeded(coordinate);

                        $(popup.getElement()).popover('show');

                        var $iframe = $('.getfeatureinfo_popup').get()[0];
                        $iframe.contentWindow.document.write(response);
                        $iframe.width = $iframe.contentWindow.document.body.scrollWidth + 20;
                        $iframe.height = $iframe.contentWindow.document.body.scrollHeight + 20;

                        $('.close', popup.getElement().nextElementSibling).click(function() {
                            $(popup.getElement()).popover('hide');
                        });
                        popup.setPosition(coordinate);
                    }
                }

                var popup = null;
                var createFeatureInfoPopupIfNeeded = function(coordinate) {
                    if ($('.getfeatureinfo_popup').length > 0) return;
                    var pop_div = document.createElement('div');
                    document.getElementsByTagName('body')[0].appendChild(pop_div);
                    popup = new ol.Overlay({
                        element: pop_div,
                        offset: [-14, -140],
                        positioning: 'bottom-center'
                    });
                    OlMap.map.addOverlay(popup);
                    var element = popup.getElement();
                    var close_button = '<button type="button" class="close"><span aria-hidden="true">×</span><span class="sr-only" translate>Close</span></button>';
                    var content = close_button + '<iframe class="getfeatureinfo_popup" width=400 height=300 style="border:0"></iframe>';
                    $(element).popover({
                        'placement': 'top',
                        'animation': false,
                        'html': true,
                        'content': content
                    });
                    $(element).popover('show');
                    popup.setPosition(coordinate);

                }

                $scope.InfoPanelService = InfoPanelService;

                //Example: displayGroupWithAttributes({name: "My group", attributes: [{name:"foo", value:"bar"}]
                $scope.displayGroupWithAttributes = function(group) {
                    InfoPanelService.groups.push(group);
                    if (!$scope.$$phase) $scope.$digest();
                }

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

                var isLayerQueriable = function(layer) {
                    if (layer instanceof ol.layer.Tile &&
                        layer.getSource() instanceof ol.source.TileWMS &&
                        layer.getSource().getParams().INFO_FORMAT) return true;
                    if (layer instanceof ol.layer.Image &&
                        layer.getSource() instanceof ol.source.ImageWMS &&
                        layer.getSource().getParams().INFO_FORMAT) return true;
                    return false;
                }

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
                            if (source.getParams().INFO_FORMAT.indexOf('xml') > 0 || source.getParams().INFO_FORMAT.indexOf('html') > 0) {
                                WmsGetFeatureInfo.request(url, source.getParams().INFO_FORMAT, coordinate);
                            }
                        }
                    }
                }

                $scope.activateFeatureQueries = function() {
                    map.addInteraction(selector);
                }

                $scope.clearInfoPanel = function() {
                    InfoPanelService.attributes = [];
                    InfoPanelService.setGroups([]);
                }

                $scope.activateFeatureQueries();

                $scope.$on('infopanel.updated', function(event) {
                    if (!$scope.$$phase) $scope.$digest();
                });

                $scope.$on('layermanager.updated', function(event) {
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
                });

                //For wms layers use this to get the features at mouse coordinates
                map.on('singleclick', function(evt) {
                    if (Core.mainpanel == 'measure') return;
                    $scope.showCoordinate(evt.coordinate, !vectors_selected); //Clear the previous content if no vector feature was selected, because otherwise it would already be cleared there
                    map.getLayers().forEach(function(layer) {
                        $scope.queryWmsLayer(layer, evt.coordinate)
                    });
                    $scope.$emit('map_clicked', evt);
                    vectors_selected = false;
                });
                $scope.$emit('scope_loaded', "Query");
            }
        ]);

    })
