/**
 * @namespace hs.compositions
 * @memberOf hs
 */

define(['angular', 'ol', 'SparqlJson', 'angularjs-socialshare', 'map', 'ows.nonwms', 'config_parsers'],

    function(angular, ol, SparqlJson, social) {
        var module = angular.module('hs.compositions', ['720kb.socialshare', 'hs.map', 'hs.core', 'hs.ows.nonwms', 'hs.compositions.config_parsers'])

        /**
         * @memberof hs.compositions
         * @name hs.compositions.directive
         * @ngdoc directive
         * @description Add composition panel to the map, consist of filtering function, keyword, list of compositions with their functions and composition pager
         */
        .directive('hs.compositions.directive', function() {
                return {
                    templateUrl: hsl_path + 'components/compositions/partials/compositions.html?bust=' + gitsha,
                    link: function(scope, element) {
                        /* TODO: This should be done more angular way */
                        //$('.mid-pane').prepend($('<div></div>').addClass('composition-info'));
                        $('.mid-pane').css('margin-top', '0px');
                        $(".keywords-panel").hide();
                    }
                };
            })
            /**
             * @memberof hs.compositions
             * @name hs.compositions.overwriteDialogDirective
             * @ngdoc directive
             * @description Display dialog window for situation, when new composition is to be loaded while there are unsaved changes in old composition 
             */
            .directive('hs.compositions.overwriteDialogDirective', function() {
                return {
                    templateUrl: hsl_path + 'components/compositions/partials/dialog_overwriteconfirm.html?bust=' + gitsha,
                    link: function(scope, element, attrs) {
                        $('#composition-overwrite-dialog').modal('show');
                    }
                };
            })
            /**
             * @memberof hs.compositions
             * @name hs.compositions.deleteDialogDirective
             * @ngdoc directive
             * @description Display dialog window for confiriming deletion of selected composition
             */
            .directive('hs.compositions.deleteDialogDirective', function() {
                return {
                    templateUrl: hsl_path + 'components/compositions/partials/dialog_delete.html?bust=' + gitsha,
                    link: function(scope, element, attrs) {
                        $('#composition-delete-dialog').modal('show');
                    }
                };
            })
            /**
             * @memberof hs.compositions
             * @name hs.compositions.shareDialogDirective
             * @ngdoc directive
             * @description Display dialog of sharing composition (URL / Social networks)
             */
            .directive('hs.compositions.shareDialogDirective', function() {
                return {
                    templateUrl: hsl_path + 'components/compositions/partials/dialog_share.html?bust=' + gitsha,
                    link: function(scope, element, attrs) {
                        $('#composition-share-dialog').modal('show');
                    }
                };
            })
            /**
             * @memberof hs.compositions
             * @name hs.compositions.infoDialogDirective
             * @ngdoc directive
             * @description Display dialog of composition info (name, abstract, thumbnail, extent, layers)
             */
            .directive('hs.compositions.infoDialogDirective', function() {
                return {
                    templateUrl: hsl_path + 'components/compositions/partials/dialog_info.html?bust=' + gitsha,
                    link: function(scope, element, attrs) {
                        $('#composition-info-dialog').modal('show');
                    }
                };
            })

        /**
         * @memberof hs.compositions
         * @name hs.compositions.service_parser
         * @ngdoc service
         * @description Contains function of managing composition (loading, removing Layers)
         */
        .service('hs.compositions.service_parser', ['hs.map.service', 'config', 'Core', '$rootScope', 'hs.utils.service', 'hs.ows.nonwms.service', 'hs.compositions.config_parsers.service',
            function(hsMap, config, Core, $rootScope, utils, nonWmsService, configParsers) {
                var me = {
                    composition_loaded: null,
                    composition_edited: false,
                    utils: utils,
                    current_composition_title: "",                 
                    /**
                    * Load selected composition from server, parse it and add layers to map. Optionally (based on app config) may open layer manager panel
                    * @memberof hs.compositions.service_parser
                    * @function load 
                    * @param {String} url Url of selected composition
                    * @param {Boolean} overwrite Whether overwrite current composition in map - remove all layers from maps which originate from composition (if not pasted, it counts as "true")
                    * @param {Function} callback Optional function which should be called when composition is successfully loaded
                    * @param {Function} pre_parse Optional function for pre-parsing loaded data about composition to accepted format
                    */
                    load: function(url, overwrite, callback, pre_parse) {
                        me.current_composition_url = url; 
                        url = url.replace('&amp;', '&');
                        url = utils.proxify(url);
                        $.ajax({
                                url: url
                            })
                            .done(function(response) {
                                if (response.success == true) {
                                    me.composition_loaded = url;
                                    if (typeof pre_parse != 'undefined') response = pre_parse(response);
                                    $rootScope.$broadcast('compositions.composition_loading', response);
                                    if (angular.isUndefined(overwrite) || overwrite == true) {
                                        me.removeCompositionLayers();
                                    }
                                    me.current_composition = response.data || response;
                                    me.current_composition_title = response.title || response.data.title;
                                    hsMap.map.getView().fit(me.parseExtent(response.extent || response.data.extent), hsMap.map.getSize());
                                    var layers = me.jsonToLayers(response);
                                    for (var i = 0; i < layers.length; i++) {
                                        hsMap.map.addLayer(layers[i]);
                                    }
                                    
                                    if(angular.isObject(response.data.current_base_layer)){
                                        hsMap.map.getLayers().forEach(function(lyr) {
                                            if (lyr.get('title') == response.data.current_base_layer.title)
                                                lyr.setVisible(true);
                                        });
                                    }
                                    
                                    if (config.open_lm_after_comp_loaded) {
                                        Core.setMainPanel('layermanager');
                                    }

                                    me.composition_edited = false;
                                    $rootScope.$broadcast('compositions.composition_loaded', response);
                                    if (typeof callback !== 'undefined' && callback !== null) callback();
                                } else {
                                    var respError = {};
                                    respError.error = response.error;
                                    switch (response.error) {
                                        case "no data":
                                            respError.title = "Composition not found";
                                            respError.abstract = "Sorry but composition was deleted or incorrectly saved"
                                            break;
                                    }
                                    $rootScope.$broadcast('compositions.composition_loaded', respError);
                                }
                            })
                    },
                    /**
                    * Remove all layers gained from composition from map 
                    * @memberof hs.compositions.service_parser
                    * @function removeCompositionLayers 
                    */
                    removeCompositionLayers: function() {
                        var to_be_removed = [];
                        hsMap.map.getLayers().forEach(function(lyr) {
                            if (lyr.get('from_composition'))
                                to_be_removed.push(lyr);
                        });
                        while (to_be_removed.length > 0) {
                            hsMap.map.removeLayer(to_be_removed.shift());
                        }
                    },
                    /**
                    * Send Ajax request to selected server to gain information about composition
                    * @memberof hs.compositions.service_parser
                    * @function loadInfo
                    * @param {String} url Url to composition info
                    * @returns {Object} Object containing composition info
                    */
                    loadInfo: function(url) {
                        var info = {};
                        url = url.replace('&amp;', '&');
                        url = utils.proxify(url);
                        $.ajax({
                                url: url,
                                async: false
                            })
                            .done(function(response) {
                                info = response.data || response;
                                $rootScope.$broadcast('compositions.composition_info_loaded', response);
                            });
                        return info;
                    },
                    /**
                    * Parse input coords (Bounding box) in EPSG:4326 and transform them to map projection
                    * @memberof hs.compositions.service_parser
                    * @function parseExtent
                    * @param {String|Array} b Bounding box to parse (Expected coords order: X1, Y1, X2, Y2; in string separator should be space " ")
                    * @returns {Array} Transformated extent coords (Order: X1, Y1, X2, Y2)
                    */
                    parseExtent: function(b) {
                        if (typeof b == 'string')
                            b = b.split(" ");
                        var first_pair = [parseFloat(b[0]), parseFloat(b[1])]
                        var second_pair = [parseFloat(b[2]), parseFloat(b[3])];
                        first_pair = ol.proj.transform(first_pair, 'EPSG:4326', hsMap.map.getView().getProjection());
                        second_pair = ol.proj.transform(second_pair, 'EPSG:4326', hsMap.map.getView().getProjection());
                        return [first_pair[0], first_pair[1], second_pair[0], second_pair[1]];
                    },
                    /**
                    * Parse composition object to extract individual layers
                    * @memberof hs.compositions.service_parser
                    * @function jsonToLayers
                    * @param {Object} j Composition object with Layers
                    * @returns {Array} Individual layer object in array
                    */
                    jsonToLayers: function(j) {
                        var layers = [];
                        if (j.data) j = j.data;
                        for (var i = 0; i < j.layers.length; i++) {
                            var lyr_def = j.layers[i];
                            layers.push(me.jsonToLayer(lyr_def));
                        }
                        return layers;
                    }
                };
                /**
                * Select correct layer parser for input data based on layer "className" property
                * @memberof hs.compositions.service_parser
                * @function jsonToLayer
                * @param {Object} lyr_def Layer to be created
                * @returns {Function} Corect parser function to create layer (from config_parsers service)
                */
                me.jsonToLayer = function(lyr_def) {
                    switch (lyr_def.className) {
                        case "HSLayers.Layer.WMS":
                            return configParsers.createWmsLayer(lyr_def);
                            break;
                        case 'OpenLayers.Layer.Vector':
                            return configParsers.createVectorLayer(lyr_def);
                            break;
                    }
                }
                return me;
            }
        ])

        /**
         * @memberof hs.compositions
         * @name hs.compositions.controller
         * @ngdoc controller
         */
        .controller('hs.compositions.controller', ['$scope', '$rootScope', '$location', '$http', 'hs.map.service', 'Core', 'hs.compositions.service_parser', 'config', 'hs.permalink.service_url', '$compile', '$cookies', 'hs.utils.service',
            function($scope, $rootScope, $location, $http, hsMap, Core, composition_parser, config, permalink, $compile, $cookies, utils) {
                $scope.page_size = 15;
                $scope.panel_name = 'composition_browser';
                $scope.keywords = {
                    "Basemap": false,
                    "Borders": false,
                    "PhysicalGeography": false,
                    "Demographics": false,
                    "Economics": false,
                    "SocioPoliticalConditions": false,
                    "Culture": false,
                    "Transport": false,
                    "LandUse": false,
                    "Environment": false,
                    "Water": false,
                    "Hazards": false,
                    "Cadastre": false,
                    "Infrastructure": false,
                    "RealEstate": false,
                    "Planning": false,
                    "ComplexInformation": false
                };
                $scope.sort_by = 'bbox';
                $scope.sort_by_attr_for_statusmanager = encodeURIComponent('[{"property":"bbox","direction":"ASC"}]');
                $scope.filter_by_extent = true;
                $scope.use_callback_for_edit = false; //Used for opening Edit panel from the list of compositions

                /**
                 * Load previous list of compositions to display on pager (based on composition entry number per page, default 15)
                 * @memberof hs.compositions.controller
                 * @function getPreviousCompositions
                 */
                $scope.getPreviousCompositions = function() {
                    if ($scope.compStart - $scope.page_size < 0) {
                        $scope.compStart = 0;
                        $scope.compNext = $scope.page_size;
                    } else {
                        $scope.compStart -= $scope.page_size;
                        $scope.compNext = $scope.compStart + $scope.page_size;
                    }
                    $scope.loadCompositions();
                }
                
                /**
                 * Load next list of compositions to display on pager (based on composition entry number per page, default 15)
                 * @memberof hs.compositions.controller
                 * @function getNextCompositions
                 */
                $scope.getNextCompositions = function() {
                    if ($scope.compNext != 0) {
                        $scope.compStart = Math.floor($scope.compNext / $scope.page_size) * $scope.page_size;

                        if ($scope.compNext + $scope.page_size > $scope.compositionsCount) {
                            $scope.compNext = $scope.compositionsCount;
                        } else {
                            $scope.compNext += $scope.page_size;
                        }
                        $scope.loadCompositions();
                    }
                }

                function getMapExtent() {
                    //UNUSED?
                }

                var ajax_req = null;
                /**
                 * Load list of compositions according to current filter values and pager position (filter, keywords, current extent, start composition, compositions number per page). Display compositions extent in map 
                 * @memberof hs.compositions.controller
                 * @function loadCompositions
                 */
                $scope.loadCompositions = function() {
                    var cur_map_size = hsMap.map.getSize();
                    var cur_map_extent = angular.isDefined(cur_map_size) ? hsMap.map.getView().calculateExtent(cur_map_size) : [0, 0, 100, 100];
                    var b = ol.proj.transformExtent(cur_map_extent, hsMap.map.getView().getProjection(), 'EPSG:4326');

                    if (angular.isDefined(config.compositions_catalogue_url)) {
                        extent_layer.getSource().clear();
                        var text_filter = $scope.query && angular.isDefined($scope.query.title) && $scope.query.title != '' ? encodeURIComponent(" AND title like '*" + $scope.query.title + "*' OR abstract like '*" + $scope.query.title + "*'") : '';
                        var keyword_filter = "";
                        var selected = [];
                        angular.forEach($scope.keywords, function(value, key) {
                            if (value) selected.push("subject='" + key + "'");
                        });
                        if (selected.length > 0)
                            keyword_filter = encodeURIComponent(' AND (' + selected.join(' OR ') + ')');


                        var bbox_delimiter = config.compositions_catalogue_url.indexOf('cswClientRun.php') > 0 ? ',' : ' ';
                        var serviceName = config.compositions_catalogue_url.indexOf('cswClientRun.php') > 0 ? 'serviceName=p4b&' : '';
                        var bbox = ($scope.filter_by_extent ? encodeURIComponent(" and BBOX='" + b.join(bbox_delimiter) + "'") : '');
                        var url = (config.hostname.user ? config.hostname.user.url : (config.hostname.compositions_catalogue ? config.hostname.compositions_catalogue.url : config.hostname.default.url)) + config.compositions_catalogue_url + "?format=json&" + serviceName + "query=type%3Dapplication" + bbox + text_filter + keyword_filter + "&lang=eng&sortBy=" + $scope.sort_by + "&detail=summary&start=" + $scope.compStart + "&limit=" + $scope.page_size;
                        url = utils.proxify(url);
                        if (ajax_req != null) ajax_req.abort();
                        ajax_req = $.ajax({
                                url: url
                            })
                            .done(function(response) {
                                ajax_req = null;
                                $('.tooltip').remove();
                                $scope.compositions = response.records;
                                if (response.records && response.records.length > 0) {
                                    $scope.compositionsCount = response.matched;
                                } else {
                                    $scope.compositionsCount = 0;
                                }

                                $scope.compNext = response.next;
                                angular.forEach($scope.compositions, function(record) {
                                    var attributes = {
                                        record: record,
                                        hs_notqueryable: true,
                                        highlighted: false
                                    };
                                    record.editable = false;
                                    if (angular.isUndefined(record.thumbnail)) {
                                        record.thumbnail = (config.hostname.user ? config.hostname.user.url : (config.hostname.status_manager ? config.hostname.status_manager.url : config.hostname.default.url)) + config.status_manager_url + '?request=loadthumb&id=' + record.id;
                                    }
                                    var extent = composition_parser.parseExtent(record.bbox);
                                    //Check if height or Width covers the whole screen
                                    if (!((extent[0] < cur_map_extent[0] && extent[2] > cur_map_extent[2]) || (extent[1] < cur_map_extent[1] && extent[3] > cur_map_extent[3]))) {
                                        attributes.geometry = ol.geom.Polygon.fromExtent(extent);
                                        attributes.is_hs_composition_extent = true;
                                        var new_feature = new ol.Feature(attributes);
                                        record.feature = new_feature;
                                        extent_layer.getSource().addFeatures([new_feature]);
                                    } else {
                                        //Composition not in extent
                                    }
                                })
                                if (!$scope.$$phase) $scope.$digest();
                                $('[data-toggle="tooltip"]').tooltip();
                                $scope.loadStatusManagerCompositions(b);
                            })
                    } else {
                        $scope.loadStatusManagerCompositions(b);
                    }
                }

                /**
                 * TODO
                 * @memberof hs.compositions.controller
                 * @function loadStatusManagerCompositions
                 * @param {ol.Extent} bbox Extent of loaded compositions
                 */
                $scope.loadStatusManagerCompositions = function(bbox) {
                        var url = (config.hostname.user ? config.hostname.user.url : (config.hostname.status_manager ? config.hostname.status_manager.url : config.hostname.default.url)) + config.status_manager_url;
                        var text_filter = $scope.query && angular.isDefined($scope.query.title) && $scope.query.title != '' ? '&q=' + encodeURIComponent('*' + $scope.query.title + '*') : '';
                        url += '?request=list&project=' + encodeURIComponent(config.project_name) + '&extent=' + bbox.join(',') + text_filter + '&start=0&limit=1000&sort=' + $scope.sort_by_attr_for_statusmanager;
                        url = utils.proxify(url);
                        ajax_req = $.ajax({
                                url: url,
                                cache: false
                            })
                            .done(function(response) {
                                if (angular.isUndefined($scope.compositions)) {
                                    $scope.compositions = [];
                                    $scope.compositionsCount = 0;
                                }
                                ajax_req = null;
                                angular.forEach(response.results, function(record) {
                                    var found = false;
                                    angular.forEach($scope.compositions, function(composition) {
                                        if (composition.id == record.id) {
                                            if (angular.isDefined(record.edit)) composition.editable = record.edit;
                                            found = true;
                                        }
                                    })
                                    if (!found) {
                                        record.editable = false;
                                        if (angular.isDefined(record.edit)) record.editable = record.edit;
                                        if (angular.isUndefined(record.link)) {
                                            record.link = (config.hostname.user ? config.hostname.user.url : (config.hostname.status_manager ? config.hostname.status_manager.url : config.hostname.default.url)) + config.status_manager_url + '?request=load&id=' + record.id;
                                        }
                                        if (angular.isUndefined(record.thumbnail)) {
                                            record.thumbnail = (config.hostname.user ? config.hostname.user.url : (config.hostname.status_manager ? config.hostname.status_manager.url : config.hostname.default.url)) + config.status_manager_url + '?request=loadthumb&id=' + record.id;
                                        }
                                        var attributes = {
                                            record: record,
                                            hs_notqueryable: true,
                                            highlighted: false
                                        }
                                        attributes.geometry = ol.geom.Polygon.fromExtent(composition_parser.parseExtent(record.extent));
                                        record.feature = new ol.Feature(attributes);
                                        extent_layer.getSource().addFeatures([record.feature]);
                                        if (record) {
                                            $scope.compositions.push(record);
                                            $scope.compositionsCount = $scope.compositionsCount + 1;
                                        }
                                    }
                                });
                                if (!$scope.$$phase) $scope.$digest();
                            })
                    }
                
                /**
                 * Handler of "Only mine" filter change, delete editable variable if needed
                 * @memberof hs.compositions.controller
                 * @function miniFilterChanged
                 */
                $scope.mineFilterChanged = function() {
                        if (angular.isDefined($scope.query.editable) && $scope.query.editable == false) delete $scope.query.editable;
                    }

                /**
                 * Reload compositions from first again, handler of changing filter
                 * @memberof hs.compositions.controller
                 * @function filterChanged
                 */
                $scope.filterChanged = function() {
                            $scope.compStart = 0;
                            $scope.compNext = $scope.page_size;
                            $scope.loadCompositions();
                        }
                
                    /**
                     * Display delete dialog of composition 
                     * @memberof hs.compositions.controller
                     * @function confirmDelete
                     * @param {object} composition Composition selected for deletion
                     */
                $scope.confirmDelete = function(composition) {
                        $scope.compositionToDelete = composition;
                        if (!$scope.$$phase) $scope.$digest();
                        $("#hs-dialog-area #composition-delete-dialog").remove();
                        var el = angular.element('<div hs.compositions.delete_dialog_directive></span>');
                        $("#hs-dialog-area").append(el)
                        $compile(el)($scope);
                    }
                
                    /**
                     * Delete selected composition from project (including deletion from composition server, useful for user created compositions)
                     * @memberof hs.compositions.controller
                     * @function delete
                     * @param {object} composition Composition to delete
                     */
                $scope.delete = function(composition) {
                        var url = (config.hostname.user ? config.hostname.user.url : (config.hostname.status_manager ? config.hostname.status_manager.url : config.hostname.default.url)) + config.status_manager_url + '?request=delete&id=' + composition.id + '&project=' + encodeURIComponent(config.project_name);
                        url = utils.proxify(url);
                        ajax_req = $.ajax({
                                url: url
                            })
                            .done(function(response) {
                                $rootScope.$broadcast('compositions.composition_deleted', composition.id);
                                $scope.loadCompositions();
                                $("#hs-dialog-area #composition-delete-dialog").remove();
                            })
                    }
                
                    /**
                     * Load selected composition for editing
                     * @memberof hs.compositions.controller
                     * @function edit
                     * @param {object} composition Selected composition
                     */
                $scope.edit = function(composition) {
                        $scope.use_callback_for_edit = true;
                        $scope.loadComposition(composition);
                    }
                
                    /**
                     * (PRIVATE) Callback for load composition function, open Status Creator panel
                     * @memberof hs.compositions.controller
                     * @function callbackForEdit
                     */
                function callbackForEdit() {
                    Core.openStatusCreator();
                }
                
                /**
                 * Highlight (or dim) composition, toogle visual state of composition extent on map
                 * @memberof hs.compositions.controller
                 * @function highlightComposition
                 * @param {object} composition Composition to highlight
                 * @param {Boolean} state Target state of composition ( True - highlighted, False - normal) 
                 */
                $scope.highlightComposition = function(composition, state) {
                    if (angular.isDefined(composition.feature))
                        composition.feature.set('highlighted', state)
                }
                
                function init(){
                    extent_layer = new ol.layer.Vector({
                        title: "Composition extents",
                        show_in_manager: false,
                        source: new ol.source.Vector(),
                        style: function(feature, resolution) {
                            return [new ol.style.Style({
                                stroke: new ol.style.Stroke({
                                    color: '#005CB6',
                                    width: feature.get('highlighted') ? 4 : 1
                                }),
                                fill: new ol.style.Fill({
                                    color: 'rgba(0, 0, 255, 0.01)'
                                })
                            })]
                        }
                    });
                                    
                    hsMap.map.on('pointermove', function(evt) {
                        var features = extent_layer.getSource().getFeaturesAtCoordinate(evt.coordinate);
                        var something_done = false;
                        $(extent_layer.getSource().getFeatures()).each(function() {
                            if (this.get("record").highlighted) {
                                this.get("record").highlighted = false;
                                something_done = true;
                            }
                        });
                        if (features.length) {
                            $(features).each(function() {
                                if (!this.get("record").highlighted) {
                                    this.get("record").highlighted = true;
                                    something_done = true;
                                }
                            })
                        }
                        if (something_done && !$scope.$$phase) $scope.$digest();
                    });
                    
                    if (angular.isDefined($cookies.get('hs_layers')) && window.permalinkApp != true) {
                        var data = $cookies.get('hs_layers');
                        var layers = composition_parser.jsonToLayers(JSON.parse(data));
                        for (var i = 0; i < layers.length; i++) {
                            hsMap.map.addLayer(layers[i]);
                        }
                        $cookies.remove('hs_layers');
                    }
                    
                    hsMap.map.addLayer(extent_layer);
                }
                
                var extent_layer;
                
                if(angular.isDefined(hsMap.map))
                    init()
                else 
                    $rootScope.$on('map.loaded', function(){
                        init();
                    });              

                $rootScope.$on('compositions.composition_edited', function(event) {
                    composition_parser.composition_edited = true;
                });

                $rootScope.$on('compositions.load_composition', function(event, id) {
                    id = (config.hostname.user ? config.hostname.user.url : (config.hostname.status_manager ? config.hostname.status_manager.url : config.hostname.default.url)) + (config.status_manager_url || '/wwwlibs/statusmanager2/index.php') + '?request=load&id=' + id;
                    composition_parser.load(id);
                });

                $rootScope.$on('infopanel.feature_selected', function(event, feature, selector) {
                    if (angular.isDefined(feature.get("is_hs_composition_extent")) && angular.isDefined(feature.get("record"))) {
                        var record = feature.get("record");
                        $scope.use_callback_for_edit = false;
                        feature.set('highlighted', false);
                        selector.getFeatures().clear();
                        $scope.loadComposition(record);
                    }
                });

                $scope.$on('map.extent_changed', function(event, data, b) {
                    if ($scope.Core.mainpanel != 'composition_browser') return;
                    if ($scope.filter_by_extent) $scope.loadCompositions();
                });

                /**
                * Prepare share object on server and display share dialog
                * @memberof hs.compositions.controller
                * @function shareComposition
                * @param {object} record Composition to share
                */
                $scope.shareComposition = function(record) {
                        var compositionUrl = (Core.isMobile() && config.permalinkLocation ? (config.permalinkLocation.origin + config.permalinkLocation.pathname) : ($location.protocol() + "://" + location.host + location.pathname)) + "?composition=" + encodeURIComponent(record.link);
                        var shareId = utils.generateUuid();
                        var metadata = {};
                        $.ajax({
                            url: ((config.hostname.user ? config.hostname.user.url : (config.hostname.status_manager ? config.hostname.status_manager.url : config.hostname.default.url)) + config.status_manager_url),
                            cache: false,
                            method: 'POST',
                            async: false,
                            data: JSON.stringify({
                                request: 'socialShare',
                                id: shareId,
                                url: encodeURIComponent(compositionUrl),
                                title: record.title,
                                description: record.abstract,
                                image: record.thumbnail || 'https://ng.hslayers.org/img/logo.jpg'
                            }),
                            success: function(j) {
                                $http.post('https://www.googleapis.com/urlshortener/v1/url?key=AIzaSyDn5HGT6LDjLX-K4jbcKw8Y29TRgbslfBw', {
                                    longUrl: (config.hostname.user ? config.hostname.user.url : (config.hostname.status_manager ? config.hostname.status_manager.url : config.hostname.default.url)) + config.status_manager_url + "?request=socialshare&id=" + shareId
                                }).success(function(data, status, headers, config) {
                                    $scope.shareUrl = data.id;
                                }).error(function(data, status, headers, config) {
                                    console.log('Error creating short Url');
                                });
                            }
                        })

                        $scope.shareTitle = record.title;
                        if(config.social_hashtag && $scope.shareTitle.indexOf(config.social_hashtag) <= 0) $scope.shareTitle += ' ' + config.social_hashtag;
                    
                        $scope.shareDescription = record.abstract;
                        if (!$scope.$$phase) $scope.$digest();
                        $("#hs-dialog-area #composition-share-dialog").remove();
                        var el = angular.element('<div hs.compositions.share_dialog_directive></div>');
                        $("#hs-dialog-area").append(el)
                        $compile(el)($scope);
                    }
                    /**
                     * Load info about composition through service and display composition info dialog
                     * @memberof hs.compositions.controller
                     * @function detailComposition
                     * @param {object} record Composition to show details
                     */
                $scope.detailComposition = function(record) {
                        $scope.info = composition_parser.loadInfo(record.link);
                        $scope.info.thumbnail = record.thumbnail;
                        if (!$scope.$$phase) $scope.$digest();
                        $("#hs-dialog-area #composition-info-dialog").remove();
                        var el = angular.element('<div hs.compositions.info_dialog_directive></span>');
                        $("#hs-dialog-area").append(el)
                        $compile(el)($scope);
                    }
                    /**
                     * Load selected composition in map, if current composition was edited display Ovewrite dialog
                     * @memberof hs.compositions.controller
                     * @function loadComposition
                     * @param {object} record Composition to be loaded
                     */
                $scope.loadComposition = function(record) {
                        var url = record.link;
                        var title = record.title;
                        if (composition_parser.composition_edited == true) {
                            var dialog_id = '#composition-overwrite-dialog';
                            $scope.composition_to_be_loaded = url;
                            $scope.composition_name_to_be_loaded = title;
                            if ($("#hs-dialog-area " + dialog_id).length == 0) {
                                var el = angular.element('<div hs.compositions.overwrite_dialog_directive></span>');
                                $("#hs-dialog-area").append(el);
                                $compile(el)($scope);
                            } else {
                                $(dialog_id).modal('show');
                            }
                        } else {
                            composition_parser.load(url, true, $scope.use_callback_for_edit ? callbackForEdit : null);
                        }
                    }
                    /**
                     * Load new composition (with service_parser Load function) without saving old composition
                     * @memberof hs.compositions.controller
                     * @function overwrite
                     */
                $scope.overwrite = function() {
                        composition_parser.load($scope.composition_to_be_loaded, true, $scope.use_callback_for_edit ? callbackForEdit : null);
                    }
                    /**
                     * Load new composition (with service_parser Load function) and merge it with old composition
                     * @memberof hs.compositions.controller
                     * @function add
                     */
                $scope.add = function() {
                        composition_parser.load($scope.composition_to_be_loaded, false, $scope.use_callback_for_edit ? callbackForEdit : null);
                    }
                    /**
                     * Open Save composition panel for saving old composition
                     * @memberof hs.compositions.controller
                     * @function save
                     */
                $scope.save = function() {
                        Core.openStatusCreator();
                    }
                    /**
                     * Set sort attribute for sorting composition list and reload compositions 
                     * @memberof hs.compositions.controller
                     * @function setSortAttribute
                     * @param {String} attribute Attribute by which compositions should be sorted (expected values: bbox, title, date)
                     */
                $scope.setSortAttribute = function(attribute) {
                        $scope.sort_by = attribute;
                        var sort_map = {
                            bbox: '[{"property":"bbox","direction":"ASC"}]',
                            title: '[{"property":"title","direction":"ASC"}]',
                            date: '[{"property":"date","direction":"ASC"}]'
                        };
                        $scope.sort_by_attr_for_statusmanager = encodeURIComponent(sort_map[attribute]);
                        $scope.loadCompositions();
                    }
                    
                    //$scope.loadCompositions();
                /**
                 * Toogle keywords panel on compositions panel
                 * @memberof hs.compositions.controller
                 * @function toggleKeywords
                 */
                $scope.toggleKeywords = function() {
                    $(".keywords-panel").slideToggle();
                }

                if (permalink.getParamValue('composition')) {
                    var id = permalink.getParamValue('composition');
                    if (id.indexOf('http') == -1 && id.indexOf(config.status_manager_url) == -1)
                        id = (config.hostname.user ? config.hostname.user.url : (config.hostname.status_manager ? config.hostname.status_manager.url : config.hostname.default.url)) + (config.status_manager_url || '/wwwlibs/statusmanager2/index.php') + '?request=load&id=' + id;
                    composition_parser.load(id);
                }

                $scope.$on('core.map_reset', function(event, data) {
                    composition_parser.composition_loaded = null;
                    composition_parser.composition_edited = false;
                });

                $scope.$emit('scope_loaded', "Compositions");
                $rootScope.$on('core.mainpanel_changed', function(event) {
                    extent_layer.setVisible(Core.panelVisible($scope.panel_name, $scope));
                    if (Core.mainpanel == 'composition_browser') $scope.loadCompositions();
                });
            }
        ]);

    })
