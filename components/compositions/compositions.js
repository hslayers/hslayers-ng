/**
 * @ngdoc module
 * @module hs.compositions
 * @name hs.compositions
 * @description Test composition module
 */

define(['angular', 'ol', 'SparqlJson', 'angularjs-socialshare', 'map', 'ows.nonwms', 'config_parsers'],

    function (angular, ol, SparqlJson, social) {
        var module = angular.module('hs.compositions', ['720kb.socialshare', 'hs.map', 'hs.core', 'hs.ows.nonwms', 'hs.compositions.config_parsers'])

            /**
             * @module hs.compositions
             * @name hs.compositions.directive
             * @ngdoc directive
             * @description Add composition panel to the map, consist of filtering function, keyword, list of compositions with their functions and composition pager
             */
            .directive('hs.compositions.directive', function () {
                return {
                    templateUrl: hsl_path + 'components/compositions/partials/compositions.html?bust=' + gitsha,
                    link: function (scope, element) {
                        /* TODO: This should be done more angular way */
                        //$('.mid-pane').prepend($('<div></div>').addClass('composition-info'));
                        $('.mid-pane').css('margin-top', '0px');
                        $(".keywords-panel").hide();
                    }
                };
            })
            /**
             * @module hs.compositions
             * @name hs.compositions.overwriteDialogDirective
             * @ngdoc directive
             * @description Display dialog window for situation, when new composition is to be loaded while there are unsaved changes in old composition 
             */
            .directive('hs.compositions.overwriteDialogDirective', function () {
                return {
                    templateUrl: hsl_path + 'components/compositions/partials/dialog_overwriteconfirm.html?bust=' + gitsha,
                    link: function (scope, element, attrs) {
                        $('#composition-overwrite-dialog').modal('show');
                    }
                };
            })
            /**
             * @module hs.compositions
             * @name hs.compositions.deleteDialogDirective
             * @ngdoc directive
             * @description Display dialog window for confiriming deletion of selected composition
             */
            .directive('hs.compositions.deleteDialogDirective', function () {
                return {
                    templateUrl: hsl_path + 'components/compositions/partials/dialog_delete.html?bust=' + gitsha,
                    link: function (scope, element, attrs) {
                        $('#composition-delete-dialog').modal('show');
                    }
                };
            })
            /**
             * @module hs.compositions
             * @name hs.compositions.shareDialogDirective
             * @ngdoc directive
             * @description Display dialog of sharing composition (URL / Social networks)
             */
            .directive('hs.compositions.shareDialogDirective', function () {
                return {
                    templateUrl: hsl_path + 'components/compositions/partials/dialog_share.html?bust=' + gitsha,
                    link: function (scope, element, attrs) {
                        $('#composition-share-dialog').modal('show');
                    }
                };
            })
            /**
             * @module hs.compositions
             * @name hs.compositions.infoDialogDirective
             * @ngdoc directive
             * @description Display dialog of composition info (name, abstract, thumbnail, extent, layers)
             */
            .directive('hs.compositions.infoDialogDirective', function () {
                return {
                    templateUrl: hsl_path + 'components/compositions/partials/dialog_info.html?bust=' + gitsha,
                    link: function (scope, element, attrs) {
                        $('#composition-info-dialog').modal('show');
                    }
                };
            })

            /**
             * @module hs.compositions
             * @name hs.compositions.service_parser
             * @ngdoc service
             * @description Contains function of managing composition (loading, removing Layers)
             */
            .service('hs.compositions.service_parser', ['hs.map.service', 'config', 'Core', '$rootScope', 'hs.utils.service', 'hs.ows.nonwms.service', 'hs.compositions.config_parsers.service',
                function (hsMap, config, Core, $rootScope, utils, nonWmsService, configParsers) {
                    var me = {
                        /**
                        * @ngdoc property
                        * @name hs.compositions.service_parser#composition_loaded
                        * @public
                        * @type {string} null
                        * @description Stores current composition URL if there is one or NULL
                        */
                        composition_loaded: null,
                        /**
                        * @ngdoc property
                        * @name hs.compositions.service_parser#composition_edited
                        * @public
                        * @type {Boolean} null
                        * @description Stores whether current composition was edited (for composition changes, saving etc.)
                        */
                        composition_edited: false,
                        utils: utils,
                        /**
                        * @ngdoc property
                        * @name hs.compositions.service_parser#current_composition_title
                        * @public
                        * @type {String} ""
                        * @description Stores title of current composition
                        */
                        current_composition_title: "",
                        /**
                        * @ngdoc method
                        * @name hs.compositions.service_parser#load 
                        * @public
                        * @param {String} url Url of selected composition
                        * @param {Boolean} overwrite Whether overwrite current composition in map - remove all layers from maps which originate from composition (if not pasted, it counts as "true")
                        * @param {Function} callback Optional function which should be called when composition is successfully loaded
                        * @param {Function} pre_parse Optional function for pre-parsing loaded data about composition to accepted format
                        * @description Load selected composition from server, parse it and add layers to map. Optionally (based on app config) may open layer manager panel
                        */
                        load: function (url, overwrite, callback, pre_parse) {
                            me.current_composition_url = url;
                            url = url.replace('&amp;', '&');
                            url = utils.proxify(url);
                            $.ajax({
                                url: url
                            })
                                .done(function (response) {
                                    if (response.success == true) {
                                        me.composition_loaded = url;
                                        if (typeof pre_parse != 'undefined') response = pre_parse(response);
                                        /**
                                        * @ngdoc event
                                        * @name hs.compositions.service_parser#compositions.composition_loading
                                        * @eventType broadcast on $rootScope
                                        * @description Fires when composition is downloaded from server and parsing begins
                                        */
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

                                        if (angular.isObject(response.data.current_base_layer)) {
                                            hsMap.map.getLayers().forEach(function (lyr) {
                                                if (lyr.get('title') == response.data.current_base_layer.title)
                                                    lyr.setVisible(true);
                                            });
                                        }

                                        if (config.open_lm_after_comp_loaded) {
                                            Core.setMainPanel('layermanager');
                                        }

                                        me.composition_edited = false;
                                        /**
                                        * @ngdoc event
                                        * @name hs.compositions.service_parser#compositions.composition_loaded
                                        * @eventType broadcast on $rootScope
                                        * @description Fires when composition is loaded or not loaded with Error message
                                        */
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
                        * @ngdoc method
                        * @name hs.compositions.service_parser#removeCompositionLayers 
                        * @public
                        * @description Remove all layers gained from composition from map 
                        */
                        removeCompositionLayers: function () {
                            var to_be_removed = [];
                            hsMap.map.getLayers().forEach(function (lyr) {
                                if (lyr.get('from_composition'))
                                    to_be_removed.push(lyr);
                            });
                            while (to_be_removed.length > 0) {
                                hsMap.map.removeLayer(to_be_removed.shift());
                            }
                        },
                        /**
                        * @ngdoc method
                        * @name hs.compositions.service_parser#loadInfo 
                        * @public
                        * @param {String} url Url to composition info
                        * @returns {Object} Object containing composition info
                        * @description Send Ajax request to selected server to gain information about composition
                        */
                        loadInfo: function (url) {
                            var info = {};
                            url = url.replace('&amp;', '&');
                            url = utils.proxify(url);
                            $.ajax({
                                url: url,
                                async: false
                            })
                                .done(function (response) {
                                    info = response.data || response;
                                    /**
                                    * @ngdoc event
                                    * @name hs.compositions.service_parser#compositions.composition_info_loaded
                                    * @eventType broadcast on $rootScope
                                    * @description Fires when metadata about selected composition are loaded
                                    */
                                    $rootScope.$broadcast('compositions.composition_info_loaded', response);
                                });
                            return info;
                        },
                        /**
                        * @ngdoc method
                        * @name hs.compositions.service_parser#parseExtent 
                        * @public
                        * @param {String|Array} b Bounding box to parse (Expected coords order: X1, Y1, X2, Y2; in string separator should be space ' ')
                        * @returns {Array} Transformated extent coords (Order: X1, Y1, X2, Y2)
                        * @description Parse input coords (Bounding box) in EPSG:4326 and transform them to map projection
                        */
                        parseExtent: function (b) {
                            if (typeof b == 'string')
                                b = b.split(" ");
                            var first_pair = [parseFloat(b[0]), parseFloat(b[1])]
                            var second_pair = [parseFloat(b[2]), parseFloat(b[3])];
                            first_pair = ol.proj.transform(first_pair, 'EPSG:4326', hsMap.map.getView().getProjection());
                            second_pair = ol.proj.transform(second_pair, 'EPSG:4326', hsMap.map.getView().getProjection());
                            return [first_pair[0], first_pair[1], second_pair[0], second_pair[1]];
                        },
                        /**
                        * @ngdoc method
                        * @name hs.compositions.service_parser#jsonToLayers 
                        * @public
                        * @param {Object} composition Composition object with Layers
                        * @returns {Array} Array of created layers
                        * @description Parse composition object to extract individual layers and add them to map
                        */
                        jsonToLayers: function (j) {
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
                    * @ngdoc method
                    * @name hs.compositions.service_parser#jsonToLayer 
                    * @public
                    * @param {Object} lyr_def Layer to be created (encapsulated in layer definition object)
                    * @returns {Function} Parser function to create layer (using config_parsers service)
                    * @description Select correct layer parser for input data based on layer "className" property (HSLayers.Layer.WMS/OpenLayers.Layer.Vector)
                    */
                    me.jsonToLayer = function (lyr_def) {
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
            .service('hs.compositions.service', ['$rootScope', '$location', '$http', 'hs.map.service', 'Core', 'hs.compositions.service_parser', 'config', 'hs.permalink.service_url', '$compile', '$cookies', 'hs.utils.service',
                function ($rootScope, $location, $http, OlMap, Core, compositionParser, config, permalink, $compile, $cookies, utils) {
                    var me = this;

                    me.data = {};

                    me.data.start = 0;
                    me.data.limit = 20;
                    me.data.next = 20;
                    me.data.useCallbackForEdit = false;

                    var extentLayer;

                    var ajaxReq;

                    me.loadCompositions = function (params) {
                        if (angular.isUndefined(params.sortBy)) params.sortBy = 'bbox'; 
                        if (angular.isUndefined(params.start)) params.start = me.data.start;
                        if (angular.isUndefined(params.limit)) params.limit = me.data.limit;
                        var mapSize = OlMap.map.getSize();
                        var mapExtent = angular.isDefined(mapSize) ? OlMap.map.getView().calculateExtent(mapSize) : [0, 0, 100, 100];
                        var b = ol.proj.transformExtent(mapExtent, OlMap.map.getView().getProjection(), 'EPSG:4326');

                        if (angular.isDefined(config.compositions_catalogue_url)) {
                            extentLayer.getSource().clear();
                            var query = params.query;
                            var textFilter = query && angular.isDefined(query.title) && query.title != '' ? encodeURIComponent(" AND title like '*" + query.title + "*' OR abstract like '*" + query.title + "*'") : '';
                            var keywordFilter = "";
                            var selected = [];
                            angular.forEach(params.keywords, function (value, key) {
                                if (value) selected.push("subject='" + key + "'");
                            });
                            if (selected.length > 0)
                                keywordFilter = encodeURIComponent(' AND (' + selected.join(' OR ') + ')');

                            var bboxDelimiter = config.compositions_catalogue_url.indexOf('cswClientRun.php') > 0 ? ',' : ' ';
                            var serviceName = config.compositions_catalogue_url.indexOf('cswClientRun.php') > 0 ? 'serviceName=p4b&' : '';
                            var bbox = (params.filterExtent ? encodeURIComponent(" and BBOX='" + b.join(bboxDelimiter) + "'") : '');
                            var url = (config.hostname.user ? config.hostname.user.url : (config.hostname.compositions_catalogue ? config.hostname.compositions_catalogue.url : config.hostname.default.url)) + config.compositions_catalogue_url + "?format=json&" + serviceName + "query=type%3Dapplication" + bbox + textFilter + keywordFilter + "&lang=eng&sortBy=" + params.sortBy + "&detail=summary&start=" + params.start + "&limit=" + params.limit;
                            url = utils.proxify(url);
                            if (ajaxReq != null) ajaxReq.abort();
                            ajaxReq = $.ajax({
                                url: url
                            })
                                .done(function (response) {
                                    ajaxReq = null;
                                    me.data.compositions = response.records;
                                    if (response.records && response.records.length > 0) {
                                        me.data.compositionsCount = response.matched;
                                    } else {
                                        me.data.compositionsCount = 0;
                                    }

                                    me.data.next = response.next;
                                    angular.forEach(me.data.compositions, function (record) {
                                        var attributes = {
                                            record: record,
                                            hs_notqueryable: true,
                                            highlighted: false
                                        };
                                        record.editable = false;
                                        if (angular.isUndefined(record.thumbnail)) {
                                            record.thumbnail = (config.hostname.user ? config.hostname.user.url : (config.hostname.status_manager ? config.hostname.status_manager.url : config.hostname.default.url)) + config.status_manager_url + '?request=loadthumb&id=' + record.id;
                                        }
                                        var extent = compositionParser.parseExtent(record.bbox);
                                        //Check if height or Width covers the whole screen
                                        if (!((extent[0] < mapExtent[0] && extent[2] > mapExtent[2]) || (extent[1] < mapExtent[1] && extent[3] > mapExtent[3]))) {
                                            attributes.geometry = ol.geom.Polygon.fromExtent(extent);
                                            attributes.is_hs_composition_extent = true;
                                            var newFeature = new ol.Feature(attributes);
                                            record.feature = newFeature;
                                            extentLayer.getSource().addFeatures([newFeature]);
                                        } else {
                                            //Composition not in extent
                                        }
                                    })
                                    if (!$rootScope.$$phase) $rootScope.$digest();
                                    $rootScope.$broadcast('CompositionsLoaded');
                                    me.loadStatusManagerCompositions(params, b);
                                })
                        } else {
                            me.loadStatusManagerCompositions(params, b);
                        }
                    }

                    me.loadStatusManagerCompositions = function (params, bbox) {
                        var url = (config.hostname.user ? config.hostname.user.url : (config.hostname.status_manager ? config.hostname.status_manager.url : config.hostname.default.url)) + config.status_manager_url;
                        var query = params.query;
                        var textFilter = query && angular.isDefined(query.title) && query.title != '' ? '&q=' + encodeURIComponent('*' + query.title + '*') : '';
                        url += '?request=list&project=' + encodeURIComponent(config.project_name) + '&extent=' + bbox.join(',') + textFilter + '&start=0&limit=1000&sort=' + getStatusSortAttr(params.sortBy);
                        url = utils.proxify(url);
                        ajaxReq = $.ajax({
                            url: url,
                            cache: false
                        })
                            .done(function (response) {
                                if (angular.isUndefined(me.data.compositions)) {
                                    me.data.compositions = [];
                                    me.data.compositionsCount = 0;
                                }
                                ajaxReq = null;
                                angular.forEach(response.results, function (record) {
                                    var found = false;
                                    angular.forEach(me.data.compositions, function (composition) {
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
                                        attributes.geometry = ol.geom.Polygon.fromExtent(compositionParser.parseExtent(record.extent));
                                        record.feature = new ol.Feature(attributes);
                                        extentLayer.getSource().addFeatures([record.feature]);
                                        if (record) {
                                            me.data.compositions.push(record);
                                            me.data.compositionsCount = me.data.compositionsCount + 1;
                                        }
                                    }
                                });
                                if (!$rootScope.$$phase) $rootScope.$digest();
                            })
                    }

                    me.resetCompositionCounter = function () {
                        me.data.start = 0;
                        me.data.next = me.data.limit;
                    }

                    me.deleteComposition = function (composition) {
                        var url = (config.hostname.user ? config.hostname.user.url : (config.hostname.status_manager ? config.hostname.status_manager.url : config.hostname.default.url)) + config.status_manager_url + '?request=delete&id=' + composition.id + '&project=' + encodeURIComponent(config.project_name);
                        url = utils.proxify(url);
                        ajaxReq = $.ajax({
                            url: url
                        })
                            .done(function (response) {
                                $rootScope.$broadcast('compositions.composition_deleted', composition.id);
                                me.loadCompositions();
                            })
                    }

                    me.highlightComposition = function (composition, state) {
                        if (angular.isDefined(composition.feature))
                            composition.feature.set('highlighted', state)
                    }

                    function getStatusSortAttr(sortBy) {
                        var sortMap = {
                            bbox: '[{"property":"bbox","direction":"ASC"}]',
                            title: '[{"property":"title","direction":"ASC"}]',
                            date: '[{"property":"date","direction":"ASC"}]'
                        };
                        return encodeURIComponent(sortMap[sortBy]);
                    }

                    function callbackForEdit() {
                        Core.openStatusCreator();
                    }

                    function init() {
                        extentLayer = new ol.layer.Vector({
                            title: "Composition extents",
                            show_in_manager: false,
                            source: new ol.source.Vector(),
                            removable: false,
                            style: function (feature, resolution) {
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

                        OlMap.map.on('pointermove', function (evt) {
                            var features = extentLayer.getSource().getFeaturesAtCoordinate(evt.coordinate);
                            var somethingDone = false;
                            angular.forEach(extentLayer.getSource().getFeatures(), function (feature) {
                                if (feature.get("record").highlighted) {
                                    feature.get("record").highlighted = false;
                                    somethingDone = true;
                                }
                            });
                            if (features.length) {
                                angular.forEach(features, function (feature) {
                                    if (!feature.get("record").highlighted) {
                                        feature.get("record").highlighted = true;
                                        somethingDone = true;
                                    }
                                })
                            }
                            if (somethingDone && !$rootScope.$$phase) $rootScope.$digest();
                        });

                        if (angular.isDefined($cookies.get('hs_layers')) && window.permalinkApp != true) {
                            var data = $cookies.get('hs_layers');
                            var layers = compositionParser.jsonToLayers(JSON.parse(data));
                            for (var i = 0; i < layers.length; i++) {
                                OlMap.map.addLayer(layers[i]);
                            }
                            $cookies.remove('hs_layers');
                        }

                        OlMap.map.addLayer(extentLayer);

                        if (permalink.getParamValue('composition')) {
                            var id = permalink.getParamValue('composition');
                            if (id.indexOf('http') == -1 && id.indexOf(config.status_manager_url) == -1)
                                id = (config.hostname.user ? config.hostname.user.url : (config.hostname.status_manager ? config.hostname.status_manager.url : config.hostname.default.url)) + (config.status_manager_url || '/wwwlibs/statusmanager2/index.php') + '?request=load&id=' + id;
                            compositionParser.load(id);
                        }
                    }

                    if (angular.isDefined(OlMap.map)) init()
                    else $rootScope.$on('map.loaded', function () { init(); });

                    $rootScope.$on('compositions.composition_edited', function (event) {
                        compositionParser.composition_edited = true;
                    });

                    $rootScope.$on('compositions.load_composition', function (event, id) {
                        id = (config.hostname.user ? config.hostname.user.url : (config.hostname.status_manager ? config.hostname.status_manager.url : config.hostname.default.url)) + (config.status_manager_url || '/wwwlibs/statusmanager2/index.php') + '?request=load&id=' + id;
                        compositionParser.load(id);
                    });

                    $rootScope.$on('infopanel.feature_selected', function (event, feature, selector) {
                        if (angular.isDefined(feature.get("is_hs_composition_extent")) && angular.isDefined(feature.get("record"))) {
                            var record = feature.get("record");
                            me.data.useCallbackForEdit = false;
                            feature.set('highlighted', false);
                            selector.getFeatures().clear();
                            me.loadComposition(record);
                        }
                    });

                    me.shareComposition = function (record) {
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
                            success: function (j) {
                                $http.post('https://www.googleapis.com/urlshortener/v1/url?key=AIzaSyDn5HGT6LDjLX-K4jbcKw8Y29TRgbslfBw', {
                                    longUrl: (config.hostname.user ? config.hostname.user.url : (config.hostname.status_manager ? config.hostname.status_manager.url : config.hostname.default.url)) + config.status_manager_url + "?request=socialshare&id=" + shareId
                                }).success(function (data, status, headers, config) {
                                    me.data.shareUrl = data.id;
                                }).error(function (data, status, headers, config) {
                                    console.log('Error creating short Url');
                                });
                            }
                        })

                        me.data.shareTitle = record.title;
                        if (config.social_hashtag && me.data.shareTitle.indexOf(config.social_hashtag) <= 0) me.data.shareTitle += ' ' + config.social_hashtag;

                        me.data.shareDescription = record.abstract;
                        if (!$rootScope.$$phase) $rootScope.$digest();
                        $rootScope.$broadcast('composition.shareCreated', me.data);
                    }

                    me.getCompositionInfo = function (composition) {
                        me.data.info = compositionParser.loadInfo(composition.link);
                        me.data.info.thumbnail = composition.thumbnail;
                        return me.data.info;
                    }

                    me.loadCompositionParser = function (record) {
                        var url = record.link;
                        var title = record.title;
                        if (compositionParser.composition_edited == true) {
                            $rootScope.$broadcast('loadComposition.notSaved', record);

                        } else {
                            me.loadComposition(url, true);
                        }
                    }

                    me.loadComposition = function (url, overwrite) {
                        compositionParser.load(url, overwrite, me.data.useCallbackForEdit ? callbackForEdit : null);
                    }

                    $rootScope.$on('core.map_reset', function (event, data) {
                        compositionParser.composition_loaded = null;
                        compositionParser.composition_edited = false;
                    });

                    $rootScope.$on('core.mainpanel_changed', function (event) {
                        if (angular.isDefined(extentLayer)) {
                            if (Core.mainpanel === 'composition_browser' || Core.mainpanel === 'composition') {
                                extentLayer.setVisible(true);
                            }
                            else extentLayer.setVisible(false);
                        }
                    });

                    return me;
                }])
            /**
             * @module hs.compositions
             * @name hs.compositions.controller
             * @ngdoc controller
             * @description Main controller of composition module
             */
            .controller('hs.compositions.controller', ['$scope', '$rootScope', '$location', '$http', 'hs.map.service', 'Core', 'hs.compositions.service_parser', 'config', 'hs.permalink.service_url', '$compile', '$cookies', 'hs.utils.service', 'hs.compositions.service',
                function ($scope, $rootScope, $location, $http, hsMap, Core, composition_parser, config, permalink, $compile, $cookies, utils, Composition) {
                    $scope.data = Composition.data;
                    /**
                    * @ngdoc property
                    * @name hs.compositions.controller#page_size
                    * @public
                    * @type {number} 15
                    * @description Number of compositions displayed on one panel page
                    */
                    $scope.pageSize = 15;
                    $scope.compStart = 0;
                    $scope.compNext = $scope.pageSize;
                    /**
                    * @ngdoc property
                    * @name hs.compositions.controller#panel_name
                    * @deprecated
                    * @type {string} composition_browser
                    * @description 
                    */
                    $scope.panel_name = 'composition_browser';
                    /**
                    * @ngdoc property
                    * @name hs.compositions.controller#keywords
                    * @public
                    * @type {Object} 
                    * @description List of keywords (currently hard-coded selection), with their selection status (Boolean value) which sets if keyword will be applied in compositions lookup
                    */
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
                    /**
                    * @ngdoc property
                    * @name hs.compositions.controller#sortBy
                    * @public
                    * @type {string} bbox
                    * @description Store current rule for sorting compositions in composition list (supported values: bbox, title, date)
                    */
                    $scope.sortBy = 'bbox';
                    /**
                    * @ngdoc property
                    * @name hs.compositions.controller#filter_by_extent
                    * @public
                    * @type {Boolean} true
                    * @description Store whether filter compositions by current window extent during composition search
                    */
                    $scope.filter_by_extent = true;
                    /**
                     * @ngdoc method
                     * @name hs.compositions.controller#getPreviousCompositions
                     * @public
                     * @description Load previous list of compositions to display on pager (number per page set by {@link hs.compositions.controller#page_size hs.compositions.controller#page_size})
                     */
                    $scope.getPreviousCompositions = function(){
                        if ($scope.compStart - $scope.pageSize < 0) {
                            $scope.compStart = 0;
                            $scope.compNext = $scope.pageSize;
                        } else {
                            $scope.compStart -= $scope.pageSize;
                            $scope.compNext = $scope.compStart + $scope.pageSize;
                        }
                        $scope.loadCompositions();
                    }

                    /**
                     * @ngdoc method
                     * @name hs.compositions.controller#getNextCompositions
                     * @public
                     * @description Load next list of compositions to display on pager (number per page set by {@link hs.compositions.controller#page_size hs.compositions.controller#page_size})
                     */
                    $scope.getNextCompositions = function(){
                        if ($scope.compNext != 0) {
                            $scope.compStart = Math.floor($scope.compNext / $scope.pageSize) * $scope.pageSize;

                            if ($scope.compNext + $scope.pageSize > $scope.compositionsCount) {
                                $scope.compNext = $scope.compositionsCount;
                            } else {
                                $scope.compNext += $scope.pageSize;
                            }
                            $scope.loadCompositions();
                        }
                    }

                    /**
                     * @ngdoc method
                     * @name hs.compositions.controller#loadCompositions
                     * @public
                     * @description Load list of compositions according to current filter values and pager position (filter, keywords, current extent, start composition, compositions number per page). Display compositions extent in map
                     */
                    $scope.loadCompositions = function() {
                        Composition.loadCompositions({
                            query: $scope.query,
                            sortBy: $scope.sortBy,
                            filterExtent: $scope.filter_by_extent,
                            keywords: $scope.keywords,
                            start: $scope.compStart,
                            limit: $scope.pageSize
                        });
                    }

                    $scope.$watch('data.next', function(){
                        $scope.compNext = $scope.data.next;
                    })
                    /**
                     * @ngdoc method
                     * @name hs.compositions.controller#loadStatusManagerCompositions
                     * @public
                     * @description Load list of compositions according to current filter values and pager position (filter, keywords, current extent, start composition, compositions number per page). Display compositions extent in map
                     */

                    /**
                     * Handler of "Only mine" filter change, delete editable variable if needed
                     * @module hs.compositions.controller
                     * @function miniFilterChanged
                     * DEPRECATED?
                     */
                    $scope.mineFilterChanged = function () {
                        if (angular.isDefined($scope.query.editable) && $scope.query.editable == false) delete $scope.query.editable;
                    }

                    /**
                     * @ngdoc method
                     * @name hs.compositions.controller#filterChanged
                     * @public
                     * @description Reloads compositions from start, used as callback when filters are changed in view
                     */
                    $scope.filterChanged = function () {
                        Composition.resetCompositionCounter();
                        $scope.compStart = 0;
                        $scope.compNext = $scope.pageSize;
                        $scope.loadCompositions();
                    }

                    /**
                     * @ngdoc method
                     * @name hs.compositions.controller#confirmDelete
                     * @public
                     * @param {object} composition Composition selected for deletion    
                     * @description Display delete dialog of composition 
                     */
                    $scope.confirmDelete = function (composition) {
                        $scope.compositionToDelete = composition;
                        if (!$scope.$$phase) $scope.$digest();
                        $("#hs-dialog-area #composition-delete-dialog").remove();
                        var el = angular.element('<div hs.compositions.delete_dialog_directive></span>');
                        $("#hs-dialog-area").append(el)
                        $compile(el)($scope);
                    }

                    /**
                     * @ngdoc method
                     * @name hs.compositions.controller#delete
                     * @public
                     * @param {object} composition Composition selected for deletion    
                     * @description Delete selected composition from project (including deletion from composition server, useful for user created compositions) 
                     */
                    $scope.delete = function (composition) {
                        Composition.deleteComposition(composition);
                    }

                    /**
                     * Load selected composition for editing
                     * @module hs.compositions.controller
                     * @function edit
                     * @param {object} composition Selected composition
                     */
                    $scope.edit = function (composition) {
                        $scope.data.useCallbackForEdit = true;
                        Composition.loadComposition(composition);
                    }

                    /**
                     * @ngdoc method
                     * @name hs.compositions.controller#highlightComposition
                     * @public
                     * @param {Object} composition Composition to highlight
                     * @param {Boolean} state Target state of composition ( True - highlighted, False - normal) 
                     * @description Highlight (or dim) composition, toogle visual state of composition extent on map
                     */
                    $scope.highlightComposition = function (composition, state) {
                        Composition.highlightComposition(composition, state);
                    }

                    $scope.$on('map.extent_changed', function (event, data, b) {
                        if (Core.mainpanel != 'composition_browser' && Core.mainpanel != 'composition') return;
                        if ($scope.filter_by_extent) $scope.loadCompositions();
                    });

                    /**
                     * @ngdoc method
                     * @name hs.compositions.controller#shareComposition
                     * @public
                     * @param {object} record Composition to share
                     * @description Prepare share object on server and display share dialog to share composition
                     */
                    $scope.shareComposition = function (record) {
                        Composition.shareComposition(record);
                        $("#hs-dialog-area #composition-share-dialog").remove();
                        var el = angular.element('<div hs.compositions.share_dialog_directive></div>');
                        $("#hs-dialog-area").append(el)
                        $compile(el)($scope);
                    }
                    /**
                     * @ngdoc method
                     * @name hs.compositions.controller#detailComposition
                     * @public
                     * @param {object} record Composition to show details
                     * @description Load info about composition through service and display composition info dialog
                     */
                    $scope.detailComposition = function (record) {
                        $scope.info = Composition.getCompositionInfo(record);
                        if (!$scope.$$phase) $scope.$digest();
                        $("#hs-dialog-area #composition-info-dialog").remove();
                        var el = angular.element('<div hs.compositions.info_dialog_directive></span>');
                        $("#hs-dialog-area").append(el)
                        $compile(el)($scope);
                    }
                    /**
                     * @ngdoc method
                     * @name hs.compositions.controller#loadComposition
                     * @public 
                     * @param {object} record Composition to be loaded 
                     * @description Load selected composition in map, if current composition was edited display Ovewrite dialog
                     */
                    $scope.loadComposition = function (record) {
                        Composition.loadCompositionParser(record);
                    }
                    /**
                     * @ngdoc method
                     * @name hs.compositions.controller#overwrite
                     * @public
                     * @description Load new composition without saving old composition
                     */
                    $scope.overwrite = function () {
                        Composition.loadComposition($scope.composition_to_be_loaded, true);
                    }
                    /**
                     * @ngdoc method
                     * @name hs.compositions.controller#add
                     * @public
                     * @description Load new composition (with service_parser Load function) and merge it with old composition
                     */
                    $scope.add = function () {
                        Composition.loadComposition($scope.composition_to_be_loaded, false);
                    }
                    /**
                     * @ngdoc method
                     * @name hs.compositions.controller#save
                     * @public
                     * @description Open Status creator panel for saving old composition
                     */
                    $scope.save = function () {
                        Core.openStatusCreator();
                    }
                    /**
                     * @ngdoc method
                     * @name hs.compositions.controller#setSortAttribute
                     * @public
                     * @param {String} attribute Attribute by which compositions should be sorted (expected values: bbox, title, date)
                     * @description Set sort attribute for sorting composition list and reload compositions 
                     */
                    $scope.setSortAttribute = function (attribute) {
                        $scope.sortBy = attribute;
                        $scope.loadCompositions();
                    }
                    /**
                     * @ngdoc method
                     * @name hs.compositions.controller#toggleKeywords
                     * @public
                     * @description Toogle keywords panel on compositions panel
                     */
                    $scope.toggleKeywords = function () {
                        $(".keywords-panel").slideToggle();
                    }

                    $scope.$on('CompositionLoaded', function () {
                        $('.tooltip').remove();
                        $('[data-toggle="tooltip"]').tooltip();
                    });

                    $scope.$on('compositions.composition_deleted', function () {
                        $("#hs-dialog-area #composition-delete-dialog").remove();
                    });

                    $scope.$on('loadComposition.notSaved', function (event, data) {
                        var dialog_id = '#composition-overwrite-dialog';
                        $scope.composition_to_be_loaded = data.link;
                        $scope.composition_name_to_be_loaded = data.title;
                        if ($("#hs-dialog-area " + dialog_id).length == 0) {
                            var el = angular.element('<div hs.compositions.overwrite_dialog_directive></span>');
                            $("#hs-dialog-area").append(el);
                            $compile(el)($scope);
                        } else {
                            $(dialog_id).modal('show');
                        }
                    });

                    $scope.$on('core.mainpanel_changed', function (event) {
                        if (Core.mainpanel === 'composition_browser' || Core.mainpanel === 'composition') {
                            $scope.loadCompositions();
                        }
                    });

                    $scope.$emit('scope_loaded', "Compositions");
                }
            ]);

    })
