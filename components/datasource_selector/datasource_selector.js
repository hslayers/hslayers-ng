/**
 * @namespace hs.datasource_selector
 * @memberOf hs
 */
define(['angular', 'ol', 'map'],
    function (angular, ol) {
        angular.module('hs.datasource_selector', ['hs.map', 'hs.ows.wms', 'hs.ows.nonwms'])
            /**
             * @ngdoc directive
             * @name hs.datasource_selector.directive
             * @memberOf hs.datasource_selector
             * @description Display Datasource selector panel in app. Panel contains datasource types switcher and loaded list of datas. 
             */
            .directive('hs.datasourceSelector.directive', function () {
                return {
                    templateUrl: hsl_path + 'components/datasource_selector/partials/datasource_selector.html?bust=' + gitsha
                };
            })

            /**
             * @ngdoc directive
             * @name hs.datasource_selector.metadataDialogDirective
             * @memberOf hs.datasource_selector
             * @description Directive for displaying metadata about data source
             */
            .directive('hs.datasourceSelector.metadataDialogDirective', function () {
                return {
                    templateUrl: hsl_path + 'components/datasource_selector/partials/dialog_metadata.html?bust=' + gitsha,
                    link: function (scope, element, attrs) {
                        $('#datasource_selector-metadata-dialog').modal('show');
                    }
                };
            })

            /**
             * @ngdoc directive
             * @name hs.datasource_selector.advancedMickaDialogDirective
             * @memberOf hs.datasource_selector
             * @description Directive for displaying extended search parameters for Micka catalogue service
             */
            .directive('hs.datasourceSelector.advancedMickaDialogDirective', function () {
                return {
                    templateUrl: hsl_path + 'components/datasource_selector/partials/dialog_micka_advanced.html?bust=' + gitsha,
                    link: function (scope, element, attrs) {
                        $('#ds-advanced-micka').modal('show');
                    }
                };
            })

            /**
             * @ngdoc directive
             * @name hs.datasource_selector.suggestionsDialogDirective
             * @memberOf hs.datasource_selector
             * @description Directive for displaying suggestions for search parameters for Micka catalogue service
             */
            .directive('hs.datasourceSelector.suggestionsDialogDirective', function () {
                return {
                    templateUrl: hsl_path + 'components/datasource_selector/partials/dialog_micka_suggestions.html?bust=' + gitsha,
                    link: function (scope, element, attrs) {
                        $('#ds-suggestions-micka').modal('show');
                        scope.data.suggestionFilter = scope.data.query[scope.data.suggestionConfig.input];
                        $('#ds-sug-filter').focus();
                        scope.DS.suggestionFilterChanged();
                    }
                };
            })

            /**
             * @ngdoc directive
             * @name hs.datasource_selector.objectDirective
             * @memberOf hs.datasource_selector
             * @description Directive for displaying metadata about data source
             */
            .directive('hs.datasourceSelector.objectDirective', ['$compile', function ($compile) {
                return {
                    templateUrl: hsl_path + 'components/datasource_selector/partials/object.html?bust=' + gitsha,
                    compile: function compile(element) {
                        var contents = element.contents().remove();
                        var contentsLinker;

                        return function (scope, iElement) {
                            scope.isIteratable = function (obj) {
                                return typeof obj == 'object'
                            };

                            if (scope.value == null) {
                                scope.obj = "-";
                            } else {
                                scope.obj = scope.value;
                            }

                            if (angular.isUndefined(contentsLinker)) {
                                contentsLinker = $compile(contents);
                            }

                            contentsLinker(scope, function (clonedElement) {
                                iElement.append(clonedElement);
                            });
                        };
                    }
                };
            }])
            .service('hs.datasource_selector.service', ['$rootScope', 'hs.map.service', 'Core', 'config', 'hs.utils.service', 'hs.ows.nonwms.service',
                function ($rootScope, OlMap, Core, config, utils, nonwmsservice) {
                    var me = this;

                    this.data = {};

                    this.data.query = {
                        textFilter: '',
                        title: '',
                        type: 'service',
                        Subject: ''
                    };

                    this.data.paging = config.dsPaging || 10;
                    this.data.textField = 'AnyText';
                    this.data.selectedLayer = null;
                    this.data.filterByExtent = true;
                    this.data.datasets = undefined;
                    this.data.mickaDS = undefined;
                    this.data.suggestionConfig = {};
                    this.data.suggestions = [];
                    this.data.suggestionsLoaded = true;
                    this.data.datasources = config.datasources || [];

                    var extentLayer = new ol.layer.Vector({
                        title: "Datasources extents",
                        show_in_manager: false,
                        source: new ol.source.Vector(),
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

                    /**
                    * @function loadDatasets
                    * @memberOf hs.datasource_selector.service
                    * @param {Object} datasets List of datasources for datasets load
                    * Get datasources and loads datasets for each (uses doadDataset)
                    */
                    this.loadDatasets = function (datasets) {
                        me.data.datasets = datasets;
                        extentLayer.getSource().clear();
                        for (var ds in me.data.datasets) {
                            me.data.datasets[ds].start = 0;
                            me.loadDataset(me.data.datasets[ds]);
                        }
                    }

                    /**
                    * @function loadDataset
                    * @memberOf hs.datasource_selector.service
                    * @param {Object} ds Configuration of selected datasource (from app config)
                    * Loads datasets metadata from selected source (CSW server). Currently supports only "Micka" type of source. Use all query params (search text, bbox, params.., sorting, paging, start) 
                    */
                    this.loadDataset = function (dataset) {
                        switch (dataset.type) {
                            case "micka":
                                var b = ol.proj.transformExtent(OlMap.map.getView().calculateExtent(OlMap.map.getSize()), OlMap.map.getView().getProjection(), 'EPSG:4326');
                                var bbox = me.data.filterByExtent ? "BBOX='" + b.join(' ') + "'" : '';
                                var ue = encodeURIComponent;
                                var text = angular.isDefined(me.data.query.textFilter) && me.data.query.textFilter.length > 0 ? me.data.query.textFilter : me.data.query.title;
                                var query = [
                                    (text != '' ? me.data.textField + ue(" like '*" + text + "*'") : ''),
                                    ue(bbox),
                                    //param2Query('type'),
                                    param2Query('ServiceType'),
                                    param2Query('topicCategory'),
                                    param2Query('Subject'),
                                    param2Query('Denominator'),
                                    param2Query('OrganisationName'),
                                    param2Query('keywords')
                                ].filter(function (n) {
                                    return n != ''
                                }).join('%20AND%20');
                                var url = dataset.url + '?request=GetRecords&format=application/json&language=' + dataset.language + '&query=' + query + (typeof me.data.query.sortby != 'undefined' && me.data.query.sortby != '' ? '&sortby=' + me.data.query.sortby : '&sortby=bbox') + '&limit=' + me.data.paging + '&start=' + dataset.start;
                                url = utils.proxify(url);
                                if (typeof dataset.ajaxReq != 'undefined') dataset.ajaxReq.abort();
                                dataset.loaded = false;
                                dataset.ajaxReq = $.ajax({
                                    url: url,
                                    cache: false,
                                    dataType: "json",
                                    success: function (j) {
                                        angular.forEach(dataset.layers, function (val) {
                                            try {
                                                if (typeof val.feature !== 'undefined' && val.feature != null)
                                                    extentLayer.getSource().removeFeature(val.feature);
                                            } catch (ex) { }
                                        })
                                        dataset.layers = [];
                                        dataset.loaded = true;
                                        if (j == null) {
                                            dataset.matched == 0;
                                        } else {
                                            dataset.matched = j.matched;
                                            dataset.next = j.next;
                                            for (var lyr in j.records) {
                                                if (j.records[lyr]) {
                                                    var obj = j.records[lyr];
                                                    dataset.layers.push(obj);
                                                    addExtentFeature(obj);
                                                }
                                            }
                                        }
                                    },
                                    error: function (e) {
                                        dataset.loaded = true;
                                    }
                                });
                                break;
                        }
                    }

                    /**
                    * @function fillCodesets
                    * @memberOf hs.datasource_selector.service
                    * @param {Object} datasets Input datasources
                    * Download codelists for all "micka" type datasources from Url specified in app config.
                    */
                    this.fillCodesets = function (datasets) {
                        for (var ds in datasets) {
                            me.fillCodeset(me.data.datasets[ds]);
                        }
                    }

                    /**
                    * @function fillCodeset
                    * @memberOf hs.datasource_selector.service
                    * @param {Object} ds Single datasource
                    * Download code-list for micka type source from Url specifiead in app config.
                    */
                    this.fillCodeset = function (ds) {
                        switch (ds.type) {
                            case "micka":
                                var url = ds.code_list_url;
                                url = utils.proxify(url);
                                if (typeof ds.code_lists == 'undefined') {
                                    ds.code_lists = {
                                        serviceType: [],
                                        applicationType: [],
                                        dataType: [],
                                        topicCategory: []
                                    }
                                }
                                ds.ajax_req_codelists = $.ajax({
                                    url: url,
                                    cache: false,
                                    success: function (j) {
                                        $("map serviceType value", j).each(function () {
                                            ds.code_lists.serviceType.push({
                                                value: $(this).attr('name'),
                                                name: $(this).html()
                                            });
                                        })
                                        $("map applicationType value", j).each(function () {
                                            ds.code_lists.applicationType.push({
                                                value: $(this).attr('name'),
                                                name: $(this).html()
                                            });
                                        })
                                        $("map applicationType value", j).each(function () {
                                            ds.code_lists.applicationType.push({
                                                value: $(this).attr('name'),
                                                name: $(this).html()
                                            });
                                        })
                                        $("map topicCategory value", j).each(function () {
                                            ds.code_lists.topicCategory.push({
                                                value: $(this).attr('name'),
                                                name: $(this).html()
                                            });
                                        })
                                        me.advancedMickaTypeChanged();
                                    }
                                });
                                break;
                        }
                    }

                    /**
                    * @function advancedMickaTypeChanged
                    * @memberOf hs.datasource_selector.service
                    * Sets Micka source level types according to current query type (service/appilication). Deprecated?
                    */
                    this.advancedMickaTypeChanged = function () {
                        if (typeof me.data.mickaDS == 'undefined') return;
                        if (typeof me.data.mickaDS.code_lists == 'undefined') return;
                        switch (me.data.query.type) {
                            case "service":
                                me.data.mickaDS.level2_types = me.data.mickaDS.code_lists.serviceType;
                                break;
                            case "application":
                                me.data.mickaDS.level2_types = me.data.mickaDS.code_lists.applicationType;
                                break;
                        }
                    }

                    this.checkAdvancedMicka = function () {
                        if (angular.isUndefined(me.data.mickaDS)) {
                            for (var ds in me.data.datasets) {
                                if (me.data.datasets[ds].type == 'micka') {
                                    me.data.mickaDS = me.data.datasets[ds];
                                }
                            }
                        }
                        if (me.data.query.title != '') me.data.query.textFilter = me.data.query.title;
                    }

                    this.changeSuggestionConfig = function (input, param, field) {
                        me.data.suggestionConfig = {
                            input: input,
                            param: param,
                            field: field
                        };
                    }

                    /**
                    * @function suggestionFilterChanged
                    * @memberOf hs.datasource_selector.service
                    * Send suggestion request to Micka CSW server and parse response
                    */
                    this.suggestionFilterChanged = function () {
                        if (typeof me.suggestionAjax != 'undefined') me.suggestionAjax.abort();
                        var url = me.data.mickaDS.url + '../util/suggest.php?&type=' + me.data.suggestionConfig.param + '&query=' + me.data.suggestionFilter;
                        url = utils.proxify(url);
                        me.data.suggestionsLoaded = false;
                        me.suggestionAjax = $.ajax({
                            url: url,
                            cache: false,
                            dataType: "json",
                            success: function (j) {
                                me.data.suggestionsLoaded = true;
                                me.data.suggestions = j.records;
                                delete me.suggestionAjax;
                                if (!$rootScope.$$phase) $rootScope.$digest();
                            }
                        });
                    }

                    /**
                    * @function addSuggestion
                    * @memberOf hs.datasource_selector.service
                    * @param {String} text Selected property value from suggestions
                    * Save suggestion into Query object
                    */
                    this.addSuggestion = function (text) {
                        me.data.query[me.data.suggestionConfig.input] = text;
                    }

                    /**
                    * @function param2Query
                    * @memberOf hs.datasource_selector.service
                    * @param {String} which Parameter name to parse
                    * (PRIVATE) Parse query parameter into encoded key value pair. 
                    */
                    function param2Query(which) {
                        if (typeof me.data.query[which] != 'undefined') {
                            if (which == 'type' && me.data.query[which] == 'data') {
                                //Special case for type 'data' because it can contain many things
                                return encodeURIComponent("(type='dataset' OR type='nonGeographicDataset' OR type='series' OR type='tile')");
                            }
                            return (me.data.query[which] != '' ? encodeURIComponent(which + "='" + me.data.query[which] + "'") : '')
                        } else {
                            if (which == 'ServiceType') {
                                return encodeURIComponent("(ServiceType=view OR ServiceType=download OR ServiceType=WMS OR ServiceType=WFS OR Format like '*KML*' OR Format like '*GeoJSON*' OR Format like '*application/sparql-results+json*')");
                            } else {
                                return '';
                            }
                        }
                    }

                    /**
                     * @function isZoomable
                     * @memberOf hs.datasource_selector.service
                     * @param {unknown} selected_layer TODO
                     * Test if it possible to zoom to layer overview (bbox has to be defined in metadata of selected layer)
                     */
                    this.isZoomable = function (layer) {
                        return angular.isDefined(layer.bbox);
                    }

                    /**
                     * @function zoomTo
                     * @memberOf hs.datasource_selector.controller
                     * @param {String} bbox Bounding box of selected layer
                     * ZoomTo / MoveTo to selected layer overview
                     */
                    this.zoomTo = function (bbox) {
                        if (typeof bbox == 'undefined') return;
                        var b = bbox.split(" ");
                        var first_pair = [parseFloat(b[0]), parseFloat(b[1])];
                        var second_pair = [parseFloat(b[2]), parseFloat(b[3])];
                        first_pair = ol.proj.transform(first_pair, 'EPSG:4326', OlMap.map.getView().getProjection());
                        second_pair = ol.proj.transform(second_pair, 'EPSG:4326', OlMap.map.getView().getProjection());
                        if (isNaN(first_pair[0]) || isNaN(first_pair[1]) || isNaN(second_pair[0]) || isNaN(second_pair[1])) return;
                        var extent = [first_pair[0], first_pair[1], second_pair[0], second_pair[1]];
                        OlMap.map.getView().fit(extent, OlMap.map.getSize());
                    }

                    /**
                     * @function addExtentFeature
                     * @memberOf hs.datasource_selector.controller
                     * @param {Object} record Record of one dataset from Get Records response
                     * (PRIVATE) Create extent features for displaying extent of loaded dataset records in map
                     */
                    function addExtentFeature(record) {
                        var attributes = {
                            record: record,
                            hs_notqueryable: true,
                            highlighted: false
                        };
                        var b = record.bbox.split(" ");
                        var first_pair = [parseFloat(b[0]), parseFloat(b[1])];
                        var second_pair = [parseFloat(b[2]), parseFloat(b[3])];
                        var mapProjectionExtent = OlMap.map.getView().getProjection().getExtent();
                        first_pair = ol.proj.transform(first_pair, 'EPSG:4326', OlMap.map.getView().getProjection());
                        second_pair = ol.proj.transform(second_pair, 'EPSG:4326', OlMap.map.getView().getProjection());
                        if (!isFinite(first_pair[0])) first_pair[0] = mapProjectionExtent[0];
                        if (!isFinite(first_pair[1])) first_pair[1] = mapProjectionExtent[1];
                        if (!isFinite(second_pair[0])) second_pair[0] = mapProjectionExtent[2];
                        if (!isFinite(second_pair[1])) second_pair[1] = mapProjectionExtent[3];
                        if (isNaN(first_pair[0]) || isNaN(first_pair[1]) || isNaN(second_pair[0]) || isNaN(second_pair[1])) return;
                        var extent = [first_pair[0], first_pair[1], second_pair[0], second_pair[1]];
                        attributes.geometry = ol.geom.Polygon.fromExtent(extent);
                        var new_feature = new ol.Feature(attributes);
                        record.feature = new_feature;
                        extentLayer.getSource().addFeatures([new_feature]);
                    }

                    /**
                     * @function layerDownload
                     * @memberOf hs.datasource_selector.controller
                     * @param {Object} ds Datasource of selected layer
                     * @param {Object} layer Metadata record of selected layer
                     * @returns {String} Download url of layer if possible 
                     * Test if layer of selected record is downloadable (KML and JSON files, with direct url) and gives Url.
                     */
                    this.layerDownload = function (ds, layer) {
                        if (ds.download == true) {
                            if (["kml", "geojson", "json"].indexOf(layer.formats[0].toLowerCase()) > -1 && layer.url.length > 0) {
                                return layer.url
                            }
                        }
                        return "#"
                    }

                    /**
                     * @function layerRDF
                     * @memberOf hs.datasource_selector.controller
                     * @param {Object} ds Datasource of selected layer
                     * @param {Object} layer Metadata record of selected layer
                     * @returns {String} URL to record file
                     * Get URL for RDF-DCAT record of selected layer
                     */
                    this.layerRDF = function (ds, layer) {
                        return ds.url + "?request=GetRecordById&id=" + layer.id + "&outputschema=http://www.w3.org/ns/dcat%23";
                    }

                    /**
                     * @function addLayerToMap
                     * @memberOf hs.datasource_selector.controller
                     * @param {Object} ds Datasource of selected layer
                     * @param {Object} layer Metadata record of selected layer
                     * Add selected layer to map (into layer manager) if possible (supported formats: WMS, WFS, Sparql, kml, geojson, json)
                     */
                    this.addLayerToMap = function (ds, layer) {
                        if (ds.type == "micka") {
                            if (layer.trida == 'service') {
                                if (layer.serviceType == 'WMS' || layer.serviceType == 'OGC:WMS' || layer.serviceType == 'view') {
                                    return "WMS";
                                } else if ((layer.link.toLowerCase()).indexOf("sparql") > -1) {
                                    var lyr = nonwmsservice.add('sparql', layer.link, layer.title || 'Layer', layer.abstract, true, 'EPSG:4326');
                                } else if (layer.serviceType == 'WFS' || layer.serviceType == 'OGC:WFS' || layer.serviceType == 'download') {
                                    return "WFS";
                                } else if (layer.formats && ["kml", "geojson", "json"].indexOf(layer.formats[0].toLowerCase()) > -1) {
                                    switch (layer.formats[0].toLowerCase()) {
                                        case "kml":
                                            var lyr = nonwmsservice.add('kml', layer.link, layer.title || 'Layer', layer.abstract, true, 'EPSG:4326');
                                            break;
                                        case "json":
                                        case "geojson":
                                            var lyr = nonwmsservice.add('geojson', layer.link, layer.title || 'Layer', layer.abstract, false, 'EPSG:4326');
                                            break;
                                    }

                                    return;
                                } else {
                                    alert('Service type "' + layer.serviceType + '" not supported.');
                                }
                            } else if (layer.trida == 'dataset') {
                                if (["kml", "geojson", "json"].indexOf(layer.formats[0].toLowerCase()) > -1) {
                                    switch (layer.formats[0].toLowerCase()) {
                                        case "kml":
                                            var lyr = nonwmsservice.add('kml', layer.link, layer.title || 'Layer', layer.abstract, true, 'EPSG:4326');
                                            break;
                                        case "json":
                                        case "geojson":
                                            var lyr = nonwmsservice.add('geojson', layer.link, layer.title || 'Layer', layer.abstract, false, 'EPSG:4326');
                                            break;
                                    }

                                    return;
                                }
                            } else {
                                alert('Datasource type "' + layer.trida + '" not supported.');
                            }
                        }
                    }

                    /**
                     * @function highlightComposition
                     * @memberOf hs.datasource_selector.service
                     * @param {unknown} composition
                     * @param {Boolean} state Desired visual state of composition (True = highlighted, False = normal)
                     * Change visual apperance of composition overview in map between highlighted and normal
                     */
                    this.highlightComposition = function (composition, state) {
                        if (typeof composition.feature !== 'undefined')
                            composition.feature.set('highlighted', state);
                    }

                    /**
                     * @function clear
                     * @memberOf hs.datasource_selector.service
                     * Clear query variable
                     */
                    this.clear = function () {
                        me.data.query.textFilter = "";
                        me.data.query.title = "";
                        me.data.query.Subject = "";
                        me.data.query.keywords = "";
                        me.data.query.OrganisationName = "";
                        me.data.query.sortby = "";
                    }

                    function dataSourceExistsAndEmpty(){
                        return me.data.datasources.length > 0 && angular.isUndefined(me.data.datasources[0].loaded)
                    }

                    function panelVisible(){
                        return Core.panelVisible('datasource_selector') || Core.panelVisible('datasourceBrowser')
                    }

                    function init() {
                        OlMap.map.on('pointermove', function (evt) {
                            var features = extentLayer.getSource().getFeaturesAtCoordinate(evt.coordinate);
                            var something_done = false;
                            $(extentLayer.getSource().getFeatures()).each(function () {
                                if (this.get("record").highlighted) {
                                    this.get("record").highlighted = false;
                                    something_done = true;
                                }
                            });
                            if (features.length) {
                                $(features).each(function () {
                                    if (!this.get("record").highlighted) {
                                        this.get("record").highlighted = true;
                                        something_done = true;
                                    }
                                })
                            }
                            if (something_done && !$rootScope.$$phase) $rootScope.$digest();
                        });
                        $rootScope.$on('map.extent_changed', function (e) {
                            if (!panelVisible()) return;
                            if (me.data.filterByExtent) me.loadDatasets(me.data.datasources);
                        });
                        OlMap.map.addLayer(extentLayer);
                        if (dataSourceExistsAndEmpty() && panelVisible()) {
                            me.loadDatasets(me.data.datasources);
                            me.fillCodesets(me.data.datasources);
                        }
                        $rootScope.$on('core.mainpanel_changed', function (event) {
                            if (dataSourceExistsAndEmpty() && panelVisible()) {
                                me.loadDatasets(me.data.datasources);
                                me.fillCodesets(me.data.datasources);
                            }
                            extentLayer.setVisible(panelVisible());
                        });
                    }

                    if (angular.isDefined(OlMap.map))
                        init()
                    else
                        $rootScope.$on('map.loaded', function () {
                            init();
                        });

                    return me;
                }])

            /**
             * @ngdoc controller
             * @memberof hs.datasource_selector
             * @name hs.datasource_selector.controller
             * @description Controller for datasource_selector
             */
            .controller('hs.datasource_selector.controller', ['$scope', 'Core', '$compile', 'hs.utils.service', '$http', 'hs.datasource_selector.service', 'config', '$mdDialog',
                function ($scope, Core, $compile, utils, $http, DS, config, $mdDialog) {
                    $scope.data = DS.data;
                    $scope.DS = DS;
                    $scope.dsPaging = $scope.data.paging;
                    $scope.wms_connecting = false;
                    $scope.config = config;
                    $scope.advancedSearch = false;
                    $scope.id_selected = Core.exists('hs.ows.controller') ? 'OWS' : '';

                    $scope.$on('ows.wms_connecting', function () {
                        $scope.wms_connecting = true;
                    });

                    $scope.datasetSelect = function (id_selected) {
                        $scope.wms_connecting = false;
                        $scope.id_selected = id_selected;
                    }

                    if(config.datasources && config.datasources.length > 0)
                        $http({
                            method: 'GET',
                            url: utils.proxify('http://opentransportnet.eu:8082/api/3/action/vocabulary_show?id=36c07014-c461-4f19-b4dc-a38106144e66')
                        }).then(function successCallback(response) {
                            $scope.otn_keywords = [{ title: '-' }];
                            angular.forEach(response.data.result.tags, function (tag) {
                                $scope.otn_keywords.push({ title: tag.name });
                            })
                        });

                    /**
                     * @function openMickaAdvancedSearch
                     * @memberOf hs.datasource_selector.controller
                     * Opens Micka Advanced Search dialog, might pass current search string.
                     */
                    $scope.openMickaAdvancedSearch = function () {
                        if ($('#ds-advanced-micka').length == 0) {
                            var el = angular.element('<div hs.datasource_selector.advanced_micka_dialog_directive></div>');
                            $("#hs-dialog-area").append(el);
                            $compile(el)($scope);
                        } else {
                            $('#ds-advanced-micka').modal('show');
                        }
                        DS.checkAdvancedMicka();
                    }

                    /**
                     * @function showSuggestions
                     * @memberOf hs.datasource_selector.controller
                     * @param {String} input Suggestion class type name (e.g. "Organisation Name")
                     * @param {String} param Suggestion paramater of Micka service (e.g. "org")
                     * @param {String} field Expected property name in response object (e.g. "value")
                     * Shows suggestions dialog and edits suggestion config.
                     */
                    $scope.showSuggestions = function (input, param, field) {
                        DS.changeSuggestionConfig(input, param, field);
                        if (config.design === "md") {
                            DS.checkAdvancedMicka();
                            $scope.data.suggestionFilter = $scope.data.query[input];
                            DS.suggestionFilterChanged();
                        } else {
                            if ($('#ds-suggestions-micka').length == 0) {
                                var el = angular.element('<div hs.datasource_selector.suggestions_dialog_directive></span>');
                                $("#hs-dialog-area").append(el);
                                $compile(el)($scope);
                            } else {
                                $('#ds-suggestions-micka').modal('show');
                                $('#ds-sug-filter').val($scope.data.query[input]).focus();
                                DS.suggestionFilterChanged();
                            }
                        }
                    }

                    /**
                     * @function getPreviousRecords
                     * @memberOf hs.datasource_selector.controller
                     * @param {Object} ds Selected datasource
                     * Loads previous records of datasets from selected datasource (based on number of results per page and current start)
                     */
                    $scope.getPreviousRecords = function (ds) {
                        if (ds.start - $scope.data.dsPaging < 0) {
                            ds.start = 0;
                            ds.next = $scope.data.dsPaging;
                        } else {
                            ds.start -= $scope.data.dsPaging;
                            ds.next = ds.start + $scope.data.dsPaging;
                        }
                        DS.loadDataset(ds);
                    }

                    /**
                     * @function getNextRecords
                     * @memberOf hs.datasource_selector.controller
                     * @param {Object} ds Selected datasource
                     * Loads next records of datasets from selected datasource (based on number of results per page and current start)
                     */
                    $scope.getNextRecords = function (ds) {
                        if (ds.next != 0) {
                            ds.start = Math.floor(ds.next / $scope.data.dsPaging) * $scope.data.dsPaging;

                            if (ds.next + $scope.data.dsPaging > ds.matched) {
                                ds.next = ds.matched;
                            } else {
                                ds.next += $scope.data.dsPaging;
                            }
                            DS.loadDataset(ds);
                        }
                    }

                    /**
                     * @function showMetadata
                     * @memberOf hs.datasource_selector.controller
                     * @param {Object} ds Datasource of selected layer
                     * @param {Object} layer Metadata record of selected layer
                     * Show metadata record dialog window for selected layer.
                     */
                    $scope.showMetadata = function (ds, layer, e) {
                        $scope.selected_layer = layer;
                        $scope.selected_ds = ds;
                        $scope.metadata = decomposeMetadata(layer);
                        if (config.design === "md") {
                            metadataDialog(e);
                        } else {
                            if (!$scope.$$phase) $scope.$digest();
                            $("#hs-dialog-area #datasource_selector-metadata-dialog").remove();
                            var el = angular.element('<div hs.datasource_selector.metadata_dialog_directive></span>');
                            $("#hs-dialog-area").append(el)
                            $compile(el)($scope);
                        }
                    }

                    function metadataDialog($event) {
                        $mdDialog.show({
                            parent: angular.element('#hsContainer'),
                            targetEvent: $event,
                            clickOutsideToClose: true,
                            escapeToClose: true,
                            scope: $scope,
                            preserveScope: true,
                            templateUrl: hsl_path + 'materialComponents/panelContents/datasourceBrowserMetadata.html',
                            controller: function DialogController($scope, $mdDialog) {
                                $scope.closeDialog = function () {
                                    $mdDialog.hide();
                                }
                            }
                        });
                    }

                    /**
                     * @function addLayerToMap
                     * @memberOf hs.datasource_selector.controller
                     * @param {Object} ds Datasource of selected layer
                     * @param {Object} layer Metadata record of selected layer
                     * Add selected layer to map (into layer manager) if possible (supported formats: WMS, WFS, Sparql, kml, geojson, json)
                     */
                    $scope.addLayerToMap = function (ds, layer) {
                        var result = DS.addLayerToMap(ds, layer);
                        if (result == "WMS") {
                            if (Core.singleDatasources) {
                                $('.dss-tabs a[href="#OWS"]').tab('show')
                            } else {
                                Core.setMainPanel('ows');
                            }
                            var link = layer.link;
                            hslayers_api.gui.Ows.setUrlAndConnect(decodeURIComponent(link), 'WMS');
                        }
                        else if (result == "WFS") {
                            if (Core.singleDatasources) {
                                $('.dss-tabs a[href="#OWS"]').tab('show')
                            } else {
                                Core.setMainPanel('ows');
                            }
                            var link = layer.link;
                            hslayers_api.gui.Ows.setUrlAndConnect(decodeURIComponent(link), 'WFS');
                        }
                        else {
                            Core.setMainPanel('layermanager');
                        }
                    }

                    /**
                     * @function setOtnKeyword
                     * @memberOf hs.datasource_selector.controller
                     * @param {String} theme Selected Otn theme keyword 
                     * Select Otn Keyword as query subject (used with dropdown list in Gui)
                     */
                    $scope.setOtnKeyword = function (theme) {
                        if (theme == '-') theme = '';
                        $scope.query.Subject = theme;
                        DS.loadDatasets(DS.datasources);
                        return false;
                    }

                    $scope.$emit('scope_loaded', "DatasourceSelector");
                }
            ]);

    });
