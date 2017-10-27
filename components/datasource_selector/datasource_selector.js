/**
 * @namespace hs.datasource_selector
 * @memberOf hs
 */
define(['angular', 'ol', 'map'],
    function(angular, ol) {
        angular.module('hs.datasource_selector', ['hs.map', 'hs.ows.wms', 'hs.ows.nonwms'])
            /**
             * @ngdoc directive
             * @name hs.datasource_selector.directive
             * @memberOf hs.datasource_selector
             * @description Display Datasource selector panel in app. Panel contains datasource types switcher and loaded list of datas. 
             */
            .directive('hs.datasourceSelector.directive', function() {
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
        .directive('hs.datasourceSelector.metadataDialogDirective', function() {
            return {
                templateUrl: hsl_path + 'components/datasource_selector/partials/dialog_metadata.html?bust=' + gitsha,
                link: function(scope, element, attrs) {
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
        .directive('hs.datasourceSelector.advancedMickaDialogDirective', function() {
            return {
                templateUrl: hsl_path + 'components/datasource_selector/partials/dialog_micka_advanced.html?bust=' + gitsha,
                link: function(scope, element, attrs) {
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
        .directive('hs.datasourceSelector.suggestionsDialogDirective', function() {
            return {
                templateUrl: hsl_path + 'components/datasource_selector/partials/dialog_micka_suggestions.html?bust=' + gitsha,
                link: function(scope, element, attrs) {
                    $('#ds-suggestions-micka').modal('show');
                    scope.suggestion_filter = scope.query[scope.suggestion_config.input];
                    $('#ds-sug-filter').focus();
                    scope.suggestionFilterChanged();
                }
            };
        })

        /**
         * @ngdoc directive
         * @name hs.datasource_selector.objectDirective
         * @memberOf hs.datasource_selector
         * @description Directive for displaying metadata about data source
         */
        .directive('hs.datasourceSelector.objectDirective', ['$compile', function($compile) {
            return {
                templateUrl: hsl_path + 'components/datasource_selector/partials/object.html?bust=' + gitsha,
                compile: function compile(element) {
                    var contents = element.contents().remove();
                    var contentsLinker;

                    return function(scope, iElement) {
                        scope.isIteratable = function(obj) {
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

                        contentsLinker(scope, function(clonedElement) {
                            iElement.append(clonedElement);
                        });
                    };
                }
            };
        }])

        /**
         * @ngdoc controller
         * @memberof hs.datasource_selector
         * @name hs.datasource_selector.controller
         * @description Controller for datasource_selector
         */
                .controller('hs.datasource_selector.controller', ['$scope', 'hs.map.service', 'Core', '$compile', 'config', 'hs.utils.service', 'hs.ows.nonwms.service', '$http',
            function($scope, OlMap, Core, $compile, config, utils, nonwmsservice, $http) {
                $scope.query = {
                    text_filter: '',
                    title: '',
                    type: 'service',
                    Subject: ''
                };
                $scope.config = config;
                $scope.dsPaging = $scope.config.dsPaging || 10;
                $scope.text_field = "AnyText";
                $scope.panel_name = 'datasource_selector';
                $scope.selected_layer = null;
                $scope.filter = {};
                $scope.filter.byExtent = true;
                $scope.wms_connecting = false;
                
                $scope.$on('ows.wms_connecting', function(){
                    $scope.wms_connecting = true;
                });
                
                $scope.datasetSelect = function(){
                    $scope.wms_connecting = false;
                }
                
                $http({
                    method: 'GET',
                    url: utils.proxify('http://opentransportnet.eu:8082/api/3/action/vocabulary_show?id=36c07014-c461-4f19-b4dc-a38106144e66')
                }).then(function successCallback(response) {
                    $scope.otn_keywords = [{title: '-'}];
                    angular.forEach(response.data.result.tags, function(tag){
                        $scope.otn_keywords.push({title: tag.name});
                    })
                });

                var map;
                
                var extent_layer = new ol.layer.Vector({
                    title: "Datasources extents",
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
                var default_style = new ol.style.Style({
                    image: new ol.style.Icon({
                        src: 'http://ewi.mmlab.be/otn/api/info/../../js/images/marker-icon.png',
                        offset: [0, 16]
                    }),
                    fill: new ol.style.Fill({
                        color: "rgba(139, 189, 214, 0.3)",
                    }),
                    stroke: new ol.style.Stroke({
                        color: '#112211',
                        width: 1
                    })
                })

                $scope.datasets = null;
                
                /**
                 * @function loadDatasets
                 * @memberOf hs.datasource_selector.controller
                 * @param {Object} datasets List of datasources for datasets load
                 * Get datasources and loads datasets for each (uses loadDataset)
                 */
                $scope.loadDatasets = function(datasets) {
                        $scope.datasets = datasets;
                        extent_layer.getSource().clear();
                        for (var ds in $scope.datasets) {
                            $scope.datasets[ds].start = 0;
                            $scope.loadDataset($scope.datasets[ds]);
                        }
                    }
                
                /**
                 * @function fillCodesets
                 * @memberOf hs.datasource_selector.controller
                 * @param {Object} datasets Input datasources
                 * Download codelists for all "micka" type datasources from Url specified in app config.
                 */
                $scope.fillCodesets = function(datasets) {
                        for (var ds in datasets) {
                            $scope.fillCodeset($scope.datasets[ds]);
                        }
                    }
                
                /**
                 * @function fillCodeset
                 * @memberOf hs.datasource_selector.controller
                 * @param {Object} ds Single datasource
                 * Download code-list for micka type source from Url specifiead in app config.
                 */
                $scope.fillCodeset = function(ds) {
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
                                    success: function(j) {
                                        $("map serviceType value", j).each(function() {
                                            ds.code_lists.serviceType.push({
                                                value: $(this).attr('name'),
                                                name: $(this).html()
                                            });
                                        })
                                        $("map applicationType value", j).each(function() {
                                            ds.code_lists.applicationType.push({
                                                value: $(this).attr('name'),
                                                name: $(this).html()
                                            });
                                        })
                                        $("map applicationType value", j).each(function() {
                                            ds.code_lists.applicationType.push({
                                                value: $(this).attr('name'),
                                                name: $(this).html()
                                            });
                                        })
                                        $("map topicCategory value", j).each(function() {
                                            ds.code_lists.topicCategory.push({
                                                value: $(this).attr('name'),
                                                name: $(this).html()
                                            });
                                        })
                                        $scope.advancedMickaTypeChanged();
                                    }
                                });
                                break;
                        }
                    }
                
                /**
                 * @function advancesMickaTypeChanged
                 * @memberOf hs.datasource_selector.controller
                 * Sets Micka source level types according to current query type (service/appilication). Deprecated?
                 */
                $scope.advancedMickaTypeChanged = function() {
                        if (typeof $scope.micka_ds == 'undefined') return;
                        if (typeof $scope.micka_ds.code_lists == 'undefined') return;
                        switch ($scope.query.type) {
                            case "service":
                                $scope.micka_ds.level2_types = $scope.micka_ds.code_lists.serviceType;
                                break;
                            case "application":
                                $scope.micka_ds.level2_types = $scope.micka_ds.code_lists.applicationType;
                                break;
                        }
                    }
                
                /**
                 * @function openMickaAdvancedSearch
                 * @memberOf hs.datasource_selector.controller
                 * Opens Micka Advanced Search dialog, might pass current search string.
                 */
                $scope.openMickaAdvancedSearch = function() {
                    if ($('#ds-advanced-micka').length == 0) {
                        var el = angular.element('<div hs.datasource_selector.advanced_micka_dialog_directive></div>');
                        $("#hs-dialog-area").append(el);
                        $compile(el)($scope);
                    } else {
                        $('#ds-advanced-micka').modal('show');
                    }
                    if (angular.isUndefined($scope.micka_ds)) {
                        for (var ds in $scope.datasets) {
                            if ($scope.datasets[ds].type == 'micka') {
                                $scope.micka_ds = $scope.datasets[ds];
                            }
                        }
                    }
                    if ($scope.query.title != '') $scope.query.text_filter = $scope.query.title;
                }

                $scope.suggestion_config = {};
                
                /**
                 * @function showSuggestions
                 * @memberOf hs.datasource_selector.controller
                 * @param {String} input Suggestion class type name (e.g. "Organisation Name")
                 * @param {String} param Suggestion paramater of Micka service (e.g. "org")
                 * @param {String} field Expected property name in response object (e.g. "value")
                 * Shows suggestions dialog and edits suggestion config.
                 */
                $scope.showSuggestions = function(input, param, field) {
                    $scope.suggestion_config = {
                        input: input,
                        param: param,
                        field: field
                    };
                    if ($('#ds-suggestions-micka').length == 0) {
                        var el = angular.element('<div hs.datasource_selector.suggestions_dialog_directive></span>');
                        $("#hs-dialog-area").append(el);
                        $compile(el)($scope);
                    } else {
                        $('#ds-suggestions-micka').modal('show');
                        $('#ds-sug-filter').val($scope.query[input]).focus();
                        $scope.suggestionFilterChanged();
                    }

                }

                $scope.suggestions = [];
                
                /**
                 * @function suggestionFilterChanged
                 * @memberOf hs.datasource_selector.controller
                 * Send suggestion request to Micka CSW server and parse response
                 */
                $scope.suggestionFilterChanged = function() {
                        if (typeof $scope.suggestion_ajax != 'undefined') $scope.suggestion_ajax.abort();
                        var url = $scope.micka_ds.url + '../util/suggest.php?&type=' + $scope.suggestion_config.param + '&query=' + $scope.suggestion_filter;
                        url = utils.proxify(url);
                        $scope.suggestion_ajax = $.ajax({
                            url: url,
                            cache: false,
                            dataType: "json",
                            success: function(j) {
                                $scope.suggestions = j.records;
                                delete $scope.suggestion_ajax;
                                if (!$scope.$$phase) $scope.$digest();
                            }
                        });
                    }
                
                /**
                 * @function addSuggestion
                 * @memberOf hs.datasource_selector.controller
                 * @param {String} text Selected property value from suggestions
                 * Save suggestion into Query object
                 */
                $scope.addSuggestion = function(text) {
                        $scope.query[$scope.suggestion_config.input] = text;
                    }
                
                /**
                 * @function loadDataset
                 * @memberOf hs.datasource_selector.controller
                 * @param {Object} ds Configuration of selected datasource (from app config)
                 * Loads datasets metadata from selected source (CSW server). Currently supports only "Micka" type of source. Use all query params (search text, bbox, params.., sorting, paging, start) 
                 */
                $scope.loadDataset = function(ds) {
                        switch (ds.type) {
                            case "micka":
                                var advanced_search_visible = $('#ds-advanced-micka').is(':visible');
                                var b = ol.proj.transformExtent(OlMap.map.getView().calculateExtent(OlMap.map.getSize()), OlMap.map.getView().getProjection(), 'EPSG:4326');
                                var bbox = $scope.filter.byExtent ? "BBOX='" + b.join(' ') + "'" : '';
                                var ue = encodeURIComponent;
                                var text = angular.isUndefined($scope.query.text_filter) || !advanced_search_visible ? $scope.query.title : $scope.query.text_filter;
                                var query = [
                                    (text != '' ? $scope.text_field + ue(" like '*" + text + "*'") : ''),
                                    ue(bbox),
                                    //param2Query('type'),
                                    param2Query('ServiceType'),
                                    param2Query('topicCategory'),
                                    param2Query('Subject'),
                                    param2Query('Denominator'),
                                    param2Query('OrganisationName')
                                ].filter(function(n) {
                                    return n != ''
                                }).join('%20AND%20');
                                var url = ds.url + '?request=GetRecords&format=application/json&language=' + ds.language +
                                    '&query=' + query +
                                    (typeof $scope.query.sortby != 'undefined' && $scope.query.sortby != '' ? '&sortby=' + $scope.query.sortby : '&sortby=bbox') +
                                    '&limit=' + $scope.dsPaging + '&start=' + ds.start;
                                url = utils.proxify(url);
                                if (typeof ds.ajax_req != 'undefined') ds.ajax_req.abort();
                                ds.ajax_req = $.ajax({
                                    url: url,
                                    cache: false,
                                    dataType: "json",
                                    success: function(j) {
                                        angular.forEach(ds.layers, function(val) {
                                            try {
                                                if (typeof val.feature !== 'undefined' && val.feature != null)
                                                    extent_layer.getSource().removeFeature(val.feature);
                                            } catch (ex) {}
                                        })
                                        ds.layers = [];
                                        ds.loaded = true;
                                        if (j == null) {
                                            ds.matched == 0;
                                        } else {
                                            ds.matched = j.matched;
                                            ds.next = j.next;
                                            for (var lyr in j.records) {
                                                if (j.records[lyr]) {
                                                    var obj = j.records[lyr];
                                                    ds.layers.push(obj);
                                                    addExtentFeature(obj);
                                                }
                                            }
                                        }
                                        if (!$scope.$$phase) $scope.$digest();
                                    }
                                });
                                if (!$scope.$$phase) $scope.$digest();
                                break;
                        }
                    }
                
                /**
                 * @function param2Query
                 * @memberOf hs.datasource_selector.controller
                 * @param {String} which Parameter name to parse
                 * (PRIVATE) Parse query parameter into encoded key value pair. 
                 */
                function param2Query(which) {
                    if (typeof $scope.query[which] != 'undefined') {
                        if (which == 'type' && $scope.query[which] == 'data') {
                            //Special case for type 'data' because it can contain many things
                            return encodeURIComponent("(type='dataset' OR type='nonGeographicDataset' OR type='series' OR type='tile')");
                        }
                        return ($scope.query[which] != '' ? encodeURIComponent(which + "='" + $scope.query[which] + "'") : '')
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
                 * @memberOf hs.datasource_selector.controller
                 * @param {unknown} selected_layer TODO
                 * Test if it possible to zoom to layer overview (bbox has to be defined in metadata of selected layer)
                 */
                $scope.isZoomable = function(selected_layer) {
                        return angular.isDefined(selected_layer.bbox);
                    }
                
                /**
                 * @function zoomTo
                 * @memberOf hs.datasource_selector.controller
                 * @param {String} bbox Bounding box of selected layer
                 * ZoomTo / MoveTo to selected layer overview
                 */
                $scope.zoomTo = function(bbox) {
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
                 * @function getPreviousRecords
                 * @memberOf hs.datasource_selector.controller
                 * @param {Object} ds Selected datasource
                 * Loads previous records of datasets from selected datasource (based on number of results per page and current start)
                 */
                $scope.getPreviousRecords = function(ds) {
                        if (ds.start - $scope.dsPaging < 0) {
                            ds.start = 0;
                            ds.next = $scope.dsPaging;
                        } else {
                            ds.start -= $scope.dsPaging;
                            ds.next = ds.start + $scope.dsPaging;
                        }
                        $scope.loadDataset(ds);
                    }
                
                /**
                 * @function getNextRecords
                 * @memberOf hs.datasource_selector.controller
                 * @param {Object} ds Selected datasource
                 * Loads next records of datasets from selected datasource (based on number of results per page and current start)
                 */
                $scope.getNextRecords = function(ds) {
                        if (ds.next != 0) {
                            ds.start = Math.floor(ds.next / $scope.dsPaging) * $scope.dsPaging;

                            if (ds.next + $scope.dsPaging > ds.matched) {
                                ds.next = ds.matched;
                            } else {
                                ds.next += $scope.dsPaging;
                            }
                            $scope.loadDataset(ds);
                        }
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
                    extent_layer.getSource().addFeatures([new_feature]);
                }
                
                /**
                 * @function setDefaultFeatureStyle
                 * @memberOf hs.datasource_selector.controller
                 * @param {Ol.style.Style} style New style
                 * Change default style to selected style (default style currently UNUSED)
                 */
                $scope.setDefaultFeatureStyle = function(style) {
                        default_style = style;
                    }
                
                /**
                 * @function showMetadata
                 * @memberOf hs.datasource_selector.controller
                 * @param {Object} ds Datasource of selected layer
                 * @param {Object} layer Metadata record of selected layer
                 * Show metadata record dialog window for selected layer.
                 */
                $scope.showMetadata = function(ds, layer) {
                        $scope.selected_layer = layer;
                        $scope.selected_ds = ds;
                        if (!$scope.$$phase) $scope.$digest();
                        $("#hs-dialog-area #datasource_selector-metadata-dialog").remove();
                        var el = angular.element('<div hs.datasource_selector.metadata_dialog_directive></span>');
                        $("#hs-dialog-area").append(el)
                        $compile(el)($scope);
                    }
                
                /**
                 * @function layerDownload
                 * @memberOf hs.datasource_selector.controller
                 * @param {Object} ds Datasource of selected layer
                 * @param {Object} layer Metadata record of selected layer
                 * @returns {String} Download url of layer if possible 
                 * Test if layer of selected record is downloadable (KML and JSON files, with direct url) and gives Url.
                 */
                $scope.layerDownload = function(ds, layer) {
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
                $scope.layerRDF = function(ds, layer) {
                        return ds.url + "?request=GetRecordById&id=" + layer.id + "&outputschema=http://www.w3.org/ns/dcat%23"
                    }
                
                /**
                 * @function addLayerToMap
                 * @memberOf hs.datasource_selector.controller
                 * @param {Object} ds Datasource of selected layer
                 * @param {Object} layer Metadata record of selected layer
                 * Add selected layer to map (into layer manager) if possible (supported formats: WMS, WFS, Sparql, kml, geojson, json)
                 */
                $scope.addLayerToMap = function(ds, layer) {
                        if (ds.type == "micka") {
                            if (layer.trida == 'service') {
                                if (layer.serviceType == 'WMS' || layer.serviceType == 'OGC:WMS' || layer.serviceType == 'view') {
                                    if (Core.singleDatasources) {
                                        $('.dss-tabs a[href="#OWS"]').tab('show')
                                    } else {
                                        Core.setMainPanel('ows');
                                    }
                                    var link = layer.link;
                                    hslayers_api.gui.Ows.setUrlAndConnect(decodeURIComponent(link), 'WMS');
                                } else if ((layer.link.toLowerCase()).indexOf("sparql") > -1) {
                                    var lyr = nonwmsservice.add('sparql', layer.link, layer.title || 'Layer', layer.abstract, true, 'EPSG:4326');
                                } else if (layer.serviceType == 'WFS' || layer.serviceType == 'OGC:WFS' || layer.serviceType == 'download') {
                                    if (Core.singleDatasources) {
                                        $('.dss-tabs a[href="#OWS"]').tab('show')
                                    } else {
                                        Core.setMainPanel('ows');
                                    }
                                    var link = layer.link;
                                    hslayers_api.gui.Ows.setUrlAndConnect(decodeURIComponent(link), 'WFS');
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

                                    Core.setMainPanel('layermanager');
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

                                    Core.setMainPanel('layermanager');
                                }
                            } else {
                                alert('Datasource type "' + layer.trida + '" not supported.');
                            }
                        }
                    }
                
                /**
                 * @function highlightComposition
                 * @memberOf hs.datasource_selector.controller
                 * @param {unknown} composition
                 * @param {Boolean} state Desired visual state of composition (True = highlighted, False = normal)
                 * Change visual apperance of composition overview in map between highlighted and normal
                 */
                $scope.highlightComposition = function(composition, state) {
                        if (typeof composition.feature !== 'undefined')
                            composition.feature.set('highlighted', state)
                    }
                
                /**
                 * @function clear
                 * @memberOf hs.datasource_selector.controller
                 * Clear query variable
                 */
                $scope.clear = function() {
                        $scope.query.text_filter = "";
                        $scope.query.title = "";
                        $scope.query.Subject = "";
                        $scope.query.keywords = "";
                        $scope.query.OrganisationName = "";
                        $scope.query.sortby = "";
                    }
                
                /**
                 * @function setOtnKeyword
                 * @memberOf hs.datasource_selector.controller
                 * @param {String} theme Selected Otn theme keyword 
                 * Select Otn Keyword as query subject (used with dropdown list in Gui)
                 */
                $scope.setOtnKeyword = function(theme) {
                    if (theme == '-') theme = '';
                    $scope.query.Subject = theme;
                    $scope.loadDatasets($scope.datasources);
                    return false;
                }

                $scope.datasources = config.datasources;
                
                /**
                 * @function init
                 * @memberOf hs.datasource_selector.controller
                 * Initialization of datasource module
                 */
                $scope.init = function() {
                    map = OlMap.map;
                    OlMap.map.on('pointermove', function(evt) {
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
                    $scope.$on('map.extent_changed', function(event, data, b) {
                        if ($scope.Core.mainpanel != 'datasource_selector') return;
                        if ($scope.filter.byExtent) $scope.loadDatasets($scope.datasources);
                    });
                    OlMap.map.addLayer(extent_layer);
                    if (angular.isUndefined($scope.datasources[0].loaded) && Core.panelVisible($scope.panel_name, $scope)) {
                        $scope.loadDatasets($scope.datasources);
                        $scope.fillCodesets($scope.datasources);
                    }
                    $scope.$emit('scope_loaded', "DatasourceSelector");
                    $scope.$on('core.mainpanel_changed', function(event) {
                        if (angular.isUndefined($scope.datasources[0].loaded) && Core.panelVisible($scope.panel_name, $scope)) {
                            $scope.loadDatasets($scope.datasources);
                            $scope.fillCodesets($scope.datasources);
                        }
                        extent_layer.setVisible(Core.panelVisible($scope.panel_name, $scope));
                    });
                }
                if(angular.isDefined(OlMap.map))
                    $scope.init()
                else 
                    $scope.$on('map.loaded', function(){
                        $scope.init();
                    });  
            }
        ]);

    });
