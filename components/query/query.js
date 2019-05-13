/**
 * @namespace hs.query
 * @memberOf hs
 */
define(['angular', 'ol', 'map', 'core', 'angular-sanitize', 'ol.popup'],

    function (angular, ol) {
        angular.module('hs.query', ['hs.map', 'hs.core', 'ngSanitize'])
            /**
            * @ngdoc directive
            * @name hs.query.directiveInfopanel
            * @memberOf hs.query
            * @description Display Infopanel with query results
            */
            .directive('hs.query.directiveInfopanel', ['config', function (config) {
                return {
                    template: require('components/query/partials/infopanel.html'),
                    // templateUrl: config.infopanel_template || `${config.hsl_path}components/layout/partials/infopanel${config.design || ''}.html`,
                };
            }])

                        /**
            * @ngdoc directive
            * @name hs.query.directiveInfopanelMd
            * @memberOf hs.query
            * @description Display Infopanel with query results
            */
           .directive('hs.query.directiveInfopanelMd', ['config', function (config) {
            return {
                template: require('components/query/partials/infopanelmd.html'),
                // templateUrl: config.infopanel_template || `${config.hsl_path}components/layout/partials/infopanel${config.design || ''}.html`,
            };
        }])

            /**
            * @ngdoc directive
            * @name hs.query.infovalue
            * @memberOf hs.query
            * @description Todo
            */
            .directive('hs.query.infovalue', ['$compile', function ($compile) {

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
            .service('hs.query.baseService', ['$rootScope', 'hs.map.service', 'Core', '$sce', 'config',
                function ($rootScope, OlMap, Core, $sce, config) {
                    var me = this;

                    var map;

                    this.queryPoint = new ol.geom.Point([0, 0]);
                    this.queryLayer = new ol.layer.Vector({
                        title: "Point clicked",
                        source: new ol.source.Vector({
                            features: [new ol.Feature({
                                geometry: me.queryPoint
                            })]
                        }),
                        show_in_manager: false,
                        removable: false,
                        style: pointClickedStyle
                    });

                    this.data = {};
                    this.data.attributes = [];
                    this.data.groups = [];
                    this.data.coordinates = [];
                    this.queryActive = false;
                    this.popupClassname = "";
                    this.selector = null;
                    this.currentQuery = null;
                    var dataCleared = true;

                    function init() {
                        map = OlMap.map;
                        me.queryActive = false;
                        map.on('singleclick', function (evt) {
                            if (!me.queryActive) return;
                            me.popupClassname = "";
                            if (!dataCleared) me.clearData();
                            dataCleared = false;
                            me.currentQuery = (Math.random() + 1).toString(36).substring(7);
                            getCoordinate(evt.coordinate);
                            me.last_coordinate_clicked = evt.coordinate; //It is used in some examples and apps
                            $rootScope.$broadcast('queryClicked', evt);
                        });
                    }

                    if (angular.isDefined(OlMap.map)) init();
                    if(me.deregisterOnMapLoaded) me.deregisterOnMapLoaded();
                    me.deregisterOnMapLoaded = $rootScope.$on('map.loaded', init);

                    this.setData = function (data, type, overwrite) {
                        if (angular.isDefined(type)) {
                            if (angular.isDefined(overwrite) && overwrite) {
                                me.data[type].length = 0;
                            }
                            me.data[type].push(data);
                            $rootScope.$broadcast('infopanel.updated'); //Compatibility, deprecated
                            $rootScope.$broadcast('query.dataUpdated');
                        }
                        else if (console) console.log('Query.BaseService.setData type not passed');
                    };

                    this.clearData = function () {
                        me.data.attributes.length = 0;
                        me.data.groups.length = 0;
                        me.data.coordinates.length = 0;
                        var invisiblePopup = me.getInvisiblePopup();
                        invisiblePopup.contentDocument.body.innerHTML = '';
                        invisiblePopup.style.height = 0;
                        invisiblePopup.style.width = 0;
                        dataCleared = true;
                    };

                    this.getInvisiblePopup = function(){
                        return document.getElementById('invisible_popup');
                    }

                    this.fillIframeAndResize = function (iframe, response, append) {
                        var iframe = me.getInvisiblePopup();
                        if (append)
                            iframe.contentDocument.body.innerHTML += response;
                        else
                            iframe.contentDocument.body.innerHTML = response;
                        var tmp_width = iframe.contentDocument.innerWidth;
                        if (tmp_width > document.getElementById("map").clientWidth - 60) tmp_width = document.getElementById("map").clientWidth - 60;
                        iframe.style.width = tmp_width + 'px';
                        var tmp_height =  iframe.contentDocument.innerHeight;
                        if (tmp_height > 700) tmp_height = 700;
                        iframe.style.height = tmp_height + 'px';
                    };

                    function getCoordinate(coordinate) {
                        me.queryPoint.setCoordinates(coordinate, 'XY');
                        var coords = {
                            name: "Coordinates",
                            projections: [{
                                "name": "EPSG:4326",
                                "value": ol.coordinate.toStringHDMS(ol.proj.transform(coordinate, map.getView().getProjection(), 'EPSG:4326'))
                            }, {
                                "name": map.getView().getProjection().getCode(),
                                "value": ol.coordinate.createStringXY(7)(coordinate)
                            }]
                        };
                        me.setData(coords, 'coordinates', true);
                        if (!$rootScope.$$phase) $rootScope.$digest();
                    }

                    this.activateQueries = function () {
                        me.queryActive = true;
                        map.addLayer(me.queryLayer);
                        $rootScope.$broadcast('queryStatusChanged');
                    };
                    this.deactivateQueries = function () {
                        me.queryActive = false;
                        map.removeLayer(me.queryLayer);
                        $rootScope.$broadcast('queryStatusChanged');
                    };

                    function pointClickedStyle(feature) {
                        var defaultStyle = new ol.style.Style({
                            image: new ol.style.Circle({
                                fill: new ol.style.Fill({
                                    color: 'rgba(255, 156, 156, 0.4)'
                                }),
                                stroke: new ol.style.Stroke({
                                    color: '#cc3333',
                                    width: 1
                                }),
                                radius: 5
                            })
                        });

                        if (angular.isDefined(config.queryPoint)) {
                            if (config.queryPoint == "hidden") {
                                defaultStyle.getImage().setRadius(0);
                            }
                            else if (config.queryPoint == "notWithin") {
                                if (me.selector.getFeatures().getLength() > 0) {
                                    defaultStyle.getImage().setRadius(0);
                                }
                            }
                        }
                        return defaultStyle;
                    }
                    if(me.deregisterVectorSelectorCreated) {
                        me.deregisterVectorSelectorCreated();
                    }
                    me.deregisterVectorSelectorCreated = $rootScope.$on('vectorSelectorCreated',function(e,selector){
                        me.selector = selector;
                    });
                }])
            .service('hs.query.wmsService', ['$rootScope', '$http', '$sce', 'hs.query.baseService', 'hs.map.service', 'hs.utils.service', 'Core', 
                function ($rootScope, $http, $sce, Base, OlMap, utils, Core) {
                    var me = this;

                    var InfoCounter = 0;

                    this.request = function (url, infoFormat, coordinate, layer) {
                        var req_url = utils.proxify(url, true);
                        var reqHash = Base.currentQuery;
                        $http({ url: req_url }).
                        then(function (response) {
                            if (reqHash != Base.currentQuery) return;
                            me.featureInfoReceived(response.data, infoFormat, url, coordinate, layer);
                        }, function (err){
                            if (reqHash != Base.currentQuery) return;
                            me.featureInfoError(coordinate);
                        });
                    };

                    /**
                    * @function featureInfoError
                    * @memberOf hs.query.service_getwmsfeatureinfo
                    * @description Error callback to decrease infoCounter
                    */
                    this.featureInfoError = function (coordinate) {
                        infoCounter--;
                        if (infoCounter === 0) {
                            queriesCollected(coordinate);
                        }
                    };
                    /**
                    * @function featureInfoReceived
                    * @memberOf hs.query.service_getwmsfeatureinfo
                    * @params {Object} response Response of GetFeatureInfoRequest
                    * @params {String} infoFormat Format of GetFeatureInfoResponse
                    * @params {String} url Url of request 
                    * @params {Ol.coordinate object} coordinate Coordinate of request
                    * Parse Information from GetFeatureInfo request. If result came in xml format, Infopanel data are updated. If response is in html, popup window is updated and shown.
                    */
                    this.featureInfoReceived = function (response, infoFormat, url, coordinate, layer) {
                        /* Maybe this will work in future OL versions
                         * var format = new ol.format.GML();
                         *  console.log(format.readFeatures(response, {}));
                         */
                        var updated = false;
                        if (infoFormat.indexOf("xml") > 0 || infoFormat.indexOf("gml") > 0) {
                            var features = response.getElementsByTagName('gml:featureMember') ||
                            response.getElementsByTagName('featureMember');
                            angular.forEach(features, function(feature){
                                var layerName = layer.get("title") || layer.get("name");
                                var layers = feature.getElementsByTagName('Layer');
                                angular.forEach(layers, function(layer){
                                    var featureName = layer.attributes[0].nodeValue;
                                    var attrs = layer.getElementsByTagName('Attribute');
                                    var attributes = [];
                                    angular.forEach(attrs, function(attr){
                                        attributes.push({
                                            "name": attr.attributes[0].nodeValue,
                                            "value": attr.innerHTML
                                        });
                                        updated = true;
                                    });
                                    var group = {
                                        layer: layerName,
                                        name: featureName,
                                        attributes: attributes
                                    };
                                    Base.setData(group, 'groups');
                                });
                            });
                            $("featureMember", response).each(function () {
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
                                        updated = true;
                                    }
                                }
                                if (updated) Base.setData(group, 'groups');
                            });
                            $("msGMLOutput", response).each(function () {
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
                                                    updated = true;
                                                }
                                            }
                                            if (updated) Base.setData(group, 'groups');
                                        }

                                    }
                                }
                            });
                        }
                        if (infoFormat.indexOf("html") > 0) {
                            if (response.length <= 1) return;
                            Base.fillIframeAndResize(Base.getInvisiblePopup(), response, true);
                            if (layer.get('popupClass') != undefined ) Base.popupClassname = "ol-popup " + layer.get('popupClass');
                        }
                        infoCounter--;
                        if (infoCounter === 0) {
                            queriesCollected(coordinate);
                        }
                    };

                    function queriesCollected(coordinate) {
                        var invisiblePopup = Base.getInvisiblePopup();
                        if (Base.data.groups.length > 0 || invisiblePopup.contentDocument.body.innerHTML.length > 30) {
                            $rootScope.$broadcast('queryWmsResult',coordinate);
                        }
                    }

                    /**
                    * @function queryWmsLayer
                    * @memberOf hs.query.controller
                    * @params {Ol.Layer} layer Layer to Query
                    * @params {Ol.coordinate} coordinate
                    * Get FeatureInfo from WMS queriable layer (only if format of response is XML/GML/HTML). Use hs.query.service_getwmsfeatureinfo service for request and parsing response.
                    */
                    this.queryWmsLayer = function (layer, coordinate) {
                        if (isLayerWmsQueryable(layer)) {
                            var source = layer.getSource();
                            var map = OlMap.map;
                            var viewResolution = map.getView().getResolution();
                            var url = source.getGetFeatureInfoUrl(
                                coordinate, viewResolution, source.getProjection() ? source.getProjection() : map.getView().getProjection(), {
                                    'INFO_FORMAT': source.getParams().INFO_FORMAT
                                });
                            if (angular.isDefined(layer.get('featureInfoLang')) && angular.isDefined(layer.get('featureInfoLang')[Core.language])) {
                                url = url.replace(source.getUrl(), layer.get('featureInfoLang')[Core.language]);
                            }
                            if (url) {
                                if (console) console.log(url);

                                if (source.getParams().INFO_FORMAT.indexOf('xml') > 0 || source.getParams().INFO_FORMAT.indexOf('html') > 0 || source.getParams().INFO_FORMAT.indexOf('gml') > 0) {
                                    infoCounter++;
                                    me.request(url, source.getParams().INFO_FORMAT, coordinate, layer);
                                }
                            }
                        }
                    };

                    function isLayerWmsQueryable(layer) {
                        if(!layer.getVisible()) return false;
                        if (layer instanceof ol.layer.Tile &&
                            layer.getSource() instanceof ol.source.TileWMS &&
                            layer.getSource().getParams().INFO_FORMAT) return true;
                        if (layer instanceof ol.layer.Image &&
                            layer.getSource() instanceof ol.source.ImageWMS &&
                            layer.getSource().getParams().INFO_FORMAT) return true;
                        return false;
                    }

                    $rootScope.$on('queryClicked', function(e, evt){
                        infoCounter = 0;
                        OlMap.map.getLayers().forEach(function (layer) {
                            if (layer.get('queryFilter') != undefined) {
                                var filter = layer.get('queryFilter');
                                if (filter(OlMap.map, layer, evt.pixel)) me.queryWmsLayer(layer, evt.coordinate);
                            }
                            else me.queryWmsLayer(layer, evt.coordinate);
                        });
                    });

                }])
            .service('hs.query.vectorService', ['$rootScope', 'hs.query.baseService', '$sce', 'hs.map.service', 'config',
                function ($rootScope, Base, $sce, OlMap, Config) {
                    var me = this;

                    this.selector = new ol.interaction.Select({
                        condition: ol.events.condition.click,
                        multi: (angular.isDefined(Config.query) && Config.query.multi) ? Config.query.multi : false
                    });
                    $rootScope.$broadcast('vectorSelectorCreated', me.selector);

                    if (Base.queryActive) OlMap.map.addInteraction(me.selector);

                    $rootScope.$on('queryStatusChanged', function(){
                        if (Base.queryActive) OlMap.map.addInteraction(me.selector);
                        else OlMap.map.removeInteraction(me.selector);
                    });

                    me.selector.getFeatures().on('add', function (e) {
                        $rootScope.$broadcast('vectorQuery.featureSelected', e.element, me.selector);
                        //deprecated
                        $rootScope.$broadcast('infopanel.feature_selected', e.element, me.selector);
                    });

                    me.selector.getFeatures().on('remove', function (e) {
                        $rootScope.$broadcast('vectorQuery.featureDelected', e.element);
                        //deprecated
                        $rootScope.$broadcast('infopanel.feature_deselected', e.element);
                    });

                    $rootScope.$on('queryClicked', function (e) {
                        Base.clearData();
                        if (!Base.queryActive) return;
                        Base.data.attributes.length = 0;
                        var features = me.selector.getFeatures().getArray();
                        angular.forEach(features, function (feature) {
                            getFeatureAttributes(feature);
                        });
                    });

                    /**
                    * @function getFeatureAttributes
                    * @memberOf hs.query.controller
                    * @params {Object} feature Selected feature from map
                    * (PRIVATE) Handler for querying vector layers of map. Get information about selected feature.
                    */
                    function getFeatureAttributes(feature) {
                        var attributes = [];
                        feature.getKeys().forEach(function (key) {
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
                                    feature.get('features')[sub_feature].getKeys().forEach(function (key) {
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
                                    });
                                    Base.setData(group, 'groups');
                                }
                            } else {
                                var obj;
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
                                attributes.push(obj);
                            }
                        });
                        var layer = feature.getLayer(OlMap.map);
                        if (angular.isUndefined(layer) || angular.isDefined(layer.get('show_in_manager')) && layer.get('show_in_manager') === false) return;
                        var layerName = layer.get("title") || layer.get("name");
                        var group = {
                            layer: layerName,
                            name: "Feature",
                            attributes: attributes
                        };
                        Base.setData(group, 'groups');
                        $rootScope.$broadcast('queryVectorResult');
                    }
                }])
            .controller('hs.query.controller', ['$scope', '$rootScope', '$timeout', 'hs.map.service', 'hs.query.baseService', 'hs.query.wmsService', 'hs.query.vectorService', 'Core', 'config',
                function ($scope, $rootScope, $timeout, OlMap, Base, WMS, Vector, Core, config) {
                    var popup = new ol.Overlay.Popup();

                    if (OlMap.map) 
                        OlMap.map.addOverlay(popup);
                    else
                        $rootScope.$on('map.loaded', function () {
                            OlMap.map.addOverlay(popup);
                        });

                        try {
                            var $mdDialog = $injector.get('$mdDialog');
            
                    $scope.showQueryDialog = function(ev) {
                        $mdDialog.show({
                            scope: this,
                            preserveScope: true,
                            template: require('components/query/partials/infopanel.html'),
                            parent: angular.element(document.body),
                            targetEvent: ev,
                            clickOutsideToClose: true
                        })
                        .then(function() {
                            console.log("Closed.");
                        }, function() {
                            console.log("Cancelled.");
                        });
                    };

                    $scope.cancelQueryDialog = function() {
                        $mdDialog.cancel();
                    };

                    $scope.showNoImagesWarning = function(){
                        $mdToast.show(
                            $mdToast.simple()
                                .textContent("No images matched the query.")
                                // .position(pinTo )
                                // .hideDelay(3000)
                        );
                    }
                } catch(ex){
                    
                }
                    
                    $scope.data = Base.data;

                    
                    var deregisterQueryStatusChanged = $rootScope.$on('queryStatusChanged', function() {
                        if (Base.queryActive) {
                            $scope.deregisterVectorQuery = $scope.$on('queryClicked', function(e) {
                                if (config.design === 'md' && $scope.data.groups.length === 0) {
                                    $scope.showNoImagesWarning();
                                }
                                if (config.design === 'md' && $scope.data.groups.length > 0) {
                                    $scope.showQueryDialog(e);
                                } else {                            
                                    popup.hide();
                                    if (['layermanager', '', 'permalink'].indexOf(Core.mainpanel) >= 0 || (Core.mainpanel == "info" && Core.sidebarExpanded == false)) Core.setMainPanel('info');
                                }
                            });

                            $scope.deregisterWmsQuery = $scope.$on('queryWmsResult', function(e,coordinate) {
                                $timeout(function(){
                                    var invisiblePopup = Base.getInvisiblePopup();
                                    if (invisiblePopup.contentDocument.body.children.length > 0) { //TODO: dont count style, title, meta towards length
                                        if (Base.popupClassname.length > 0 ) popup.getElement().className = Base.popupClassname;
                                        else popup.getElement().className = "ol-popup";
                                        popup.show(coordinate, invisiblePopup.contentDocument.body.innerHTML);
                                        $rootScope.$broadcast('popupOpened','hs.query');
                                    }
                                })
                            });
                        } else {
                            if($scope.deregisterVectorQuery) $scope.deregisterVectorQuery();
                            if($scope.deregisterWmsQuery) $scope.deregisterWmsQuery();
                        }
                    });
                    $scope.$on('$destroy', function() {
                        if(deregisterQueryStatusChanged) deregisterQueryStatusChanged();
                    });
    
                    if (Core.current_panel_queryable) {
                        if (!Base.queryActive) Base.activateQueries();
                    }    
                    else {
                        if (Base.queryActive) Base.deactivateQueries();
                    }

                    $scope.$on('queryVectorResult',function() {
                        if (!$scope.$$phase) $scope.$digest();
                    });
    
                    //add current panel queriable - activate/deactivate
                    $scope.$on('core.mainpanel_changed', function(event, closed) {
                        if (angular.isDefined(closed) && closed.panel_name == "info") {
                            popup.hide();
                            Base.deactivateQueries();
                        }
                        else if (Core.current_panel_queryable) {
                            if (!Base.queryActive) Base.activateQueries();
                        }    
                        else {
                            if (Base.queryActive) Base.deactivateQueries();
                        }
                    });
                    
                    $scope.$on('popupOpened', function (e, source) {
                        if (angular.isDefined(source) && source != "hs.query" && angular.isDefined(popup)) popup.hide();
                    });

                    $scope.$emit('scope_loaded', "Query");
                }]);
    });
