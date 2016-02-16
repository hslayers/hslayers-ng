/**
 * @namespace hs.datasource_selector
 * @memberOf hs
 */
define(['angular', 'ol', 'map'],
    function(angular, ol) {
        angular.module('hs.datasource_selector', ['hs.map'])
            .directive('hs.datasourceSelector.directive', function() {
                return {
                    templateUrl: hsl_path + 'components/datasource_selector/partials/datasource_selector.html'
                };
            })

        /**
         * @class hs.datasource_selector.metadataDialogDirective
         * @memberOf hs.datasource_selector
         * @description Directive for displaying metadata about data source
         */
        .directive('hs.datasourceSelector.metadataDialogDirective', function() {
            return {
                templateUrl: hsl_path + 'components/datasource_selector/partials/dialog_metadata.html',
                link: function(scope, element, attrs) {
                    $('#datasource_selector-metadata-dialog').modal('show');
                }
            };
        })

        /**
         * @class hs.datasource_selector.advancedMickaDialogDirective
         * @memberOf hs.datasource_selector
         * @description Directive for displaying extended search parameters for Micka catalogue service
         */
        .directive('hs.datasourceSelector.advancedMickaDialogDirective', function() {
            return {
                templateUrl: hsl_path + 'components/datasource_selector/partials/dialog_micka_advanced.html',
                link: function(scope, element, attrs) {
                    $('#ds-advanced-micka').modal('show');
                }
            };
        })


        /**
         * @class hs.datasource_selector.suggestionsDialogDirective
         * @memberOf hs.datasource_selector
         * @description Directive for displaying suggestions for search parameters for Micka catalogue service
         */
        .directive('hs.datasourceSelector.suggestionsDialogDirective', function() {
            return {
                templateUrl: hsl_path + 'components/datasource_selector/partials/dialog_micka_suggestions.html',
                link: function(scope, element, attrs) {
                    $('#ds-suggestions-micka').modal('show');
                    scope.suggestion_filter = scope.query[scope.suggestion_config.input];
                    $('#ds-sug-filter').focus();
                    scope.suggestionFilterChanged();
                }
            };
        })

        /**
         * @class hs.datasource_selector.objectDirective
         * @memberOf hs.datasource_selector
         * @description Directive for displaying metadata about data source
         */
        .directive('hs.datasourceSelector.objectDirective', ['$compile', function($compile) {
            return {
                templateUrl: hsl_path + 'components/datasource_selector/partials/object.html',
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

        .controller('hs.datasource_selector.controller', ['$scope', 'hs.map.service', 'Core', '$compile', 'config', 'hs.utils.service',
            function($scope, OlMap, Core, $compile, config, utils) {
                $scope.query = {
                    text_filter: '',
                    title: '',
                    type: 'service'
                };
                $scope.config = config;
                $scope.text_field = "AnyText";
                $scope.panel_name = 'datasource_selector';
                $scope.selected_layer = null;
                $scope.filter_by_extent = true;

                var map = OlMap.map;
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

                $scope.loadDatasets = function(datasets) {
                    $scope.datasets = datasets;
                    extent_layer.getSource().clear();
                    for (var ds in $scope.datasets) {
                        $scope.datasets[ds].start = 0;
                        $scope.loadDataset($scope.datasets[ds]);
                    }
                }

                $scope.fillCodesets = function(datasets) {
                    for (var ds in datasets) {
                        $scope.fillCodeset($scope.datasets[ds]);
                    }
                }

                $scope.fillCodeset = function(ds) {
                    switch (ds.type) {
                        case "datatank":

                            break;
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

                $scope.openMickaAdvancedSearch = function() {
                    if ($('#ds-advanced-micka').length == 0) {
                        var el = angular.element('<div hs.datasource_selector.advanced_micka_dialog_directive></span>');
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

                $scope.addSuggestion = function(text) {
                    $scope.query[$scope.suggestion_config.input] = text;
                }

                $scope.loadDataset = function(ds) {
                    switch (ds.type) {
                        case "datatank":
                            var url = ds.url;
                            url = utils.proxify(url);
                            if (typeof ds.ajax_req != 'undefined') ds.ajax_req.abort();
                            ds.ajax_req = $.ajax({
                                url: url,
                                cache: false,
                                dataType: "json",
                                success: function(j) {
                                    ds.layers = [];
                                    ds.loaded = true;
                                    ds.matched = j.length;
                                    for (var lyr in j) {
                                        if (j[lyr].keywords && j[lyr].keywords.indexOf("kml") > -1) {
                                            var obj = j[lyr];
                                            ds.layers.push(obj);
                                        }
                                    }
                                    ds.matched = ds.layers.length;
                                    if (!$scope.$$phase) $scope.$digest();
                                }
                            });
                            break;
                        case "ckan":
                            var url = ds.url;
                            url = utils.proxify(url);
                            if (typeof ds.ajax_req != 'undefined') ds.ajax_req.abort();
                            ds.ajax_req = $.ajax({
                                url: url,
                                cache: false,
                                dataType: "json",
                                success: function(j) {
                                    ds.layers = [];
                                    ds.loaded = true;
                                    ds.matched = j.count;
                                    for (var lyr in j.datasets) {
                                        var obj = j.datasets[lyr];
                                        obj.title = obj.name;
                                        ds.layers.push(obj);
                                    }
                                    if (!$scope.$$phase) $scope.$digest();
                                }
                            });
                            break;
                        case "micka":
                            var advanced_search_visible = $('#ds-advanced-micka').is(':visible');
                            var b = ol.proj.transformExtent(OlMap.map.getView().calculateExtent(OlMap.map.getSize()), OlMap.map.getView().getProjection(), 'EPSG:4326');
                            var bbox = $scope.filter_by_extent ? "BBOX='" + b.join(' ') + "'" : '';
                            var ue = encodeURIComponent;
                            var text = angular.isUndefined($scope.query.text_filter) || !advanced_search_visible ? $scope.query.title : $scope.query.text_filter;
                            var query = [
                                (text != '' ? $scope.text_field + ue(" like '*" + text + "*'") : ''),
                                ue(bbox),
                                //param2Query('type'),
                                param2Query('ServiceType'),
                                param2Query('topicCategory'),
                                param2Query('Denominator'),
                                param2Query('OrganisationName')
                            ].filter(function(n) {
                                return n != ''
                            }).join('%20AND%20');
                            var url = ds.url + '?request=GetRecords&format=application/json&language=' + ds.language +
                                '&query=' + query +
                                (typeof $scope.query.sortby != 'undefined' && $scope.query.sortby != '' ? '&sortby=' + $scope.query.sortby : '&sortby=bbox') +
                                '&limit=10&start=' + ds.start;
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

                function param2Query(which) {
                    if (typeof $scope.query[which] != 'undefined') {
                        if (which == 'type' && $scope.query[which] == 'data') {
                            //Special case for type 'data' because it can contain many things
                            return encodeURIComponent("(type='dataset' OR type='nonGeographicDataset' OR type='series' OR type='tile')");
                        }
                        return ($scope.query[which] != '' ? encodeURIComponent(which + "='" + $scope.query[which] + "'") : '')
                    } else {
                        if (which == 'ServiceType') {
                            return encodeURIComponent("(ServiceType=view OR ServiceType=WMS OR Format like '*KML*' OR Format like '*GeoJSON*')");
                        } else {
                            return '';
                        }
                    }
                }

                $scope.isZoomable = function(selected_layer) {
                    return angular.isDefined(selected_layer.bbox);
                }

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

                $scope.getPreviousRecords = function(ds) {
                    ds.start -= 10;
                    $scope.loadDataset(ds);
                }

                $scope.getNextRecords = function(ds) {
                    ds.start = ds.next;
                    ds.next += 10;
                    $scope.loadDataset(ds);
                }

                function addExtentFeature(record) {
                    var attributes = {
                        record: record,
                        hs_notqueryable: true,
                        highlighted: false
                    };
                    var b = record.bbox.split(" ");
                    var first_pair = [parseFloat(b[0]), parseFloat(b[1])];
                    var second_pair = [parseFloat(b[2]), parseFloat(b[3])];
                    first_pair = ol.proj.transform(first_pair, 'EPSG:4326', OlMap.map.getView().getProjection());
                    second_pair = ol.proj.transform(second_pair, 'EPSG:4326', OlMap.map.getView().getProjection());
                    if (isNaN(first_pair[0]) || isNaN(first_pair[1]) || isNaN(second_pair[0]) || isNaN(second_pair[1])) return;
                    var extent = [first_pair[0], first_pair[1], second_pair[0], second_pair[1]];
                    attributes.geometry = ol.geom.Polygon.fromExtent(extent);
                    var new_feature = new ol.Feature(attributes);
                    record.feature = new_feature;
                    extent_layer.getSource().addFeatures([new_feature]);
                }

                $scope.setDefaultFeatureStyle = function(style) {
                    default_style = style;
                }

                $scope.showMetadata = function(ds, layer) {
                    $scope.selected_layer = layer;
                    $scope.selected_ds = ds;
                    if (!$scope.$$phase) $scope.$digest();
                    $("#hs-dialog-area #datasource_selector-metadata-dialog").remove();
                    var el = angular.element('<div hs.datasource_selector.metadata_dialog_directive></span>');
                    $("#hs-dialog-area").append(el)
                    $compile(el)($scope);
                }

                $scope.layerDownload = function(ds, layer) {
                    if (ds.download == true) {

                        if (ds.type == "ckan") {
                            if (["kml", "geojson", "json"].indexOf(layer.format.toLowerCase()) > -1 && layer.url.length > 0) {
                                return layer.url
                            }
                        } else if (ds.type == "micka") {
                            return "#"
                        }
                    }

                    return "#"
                }

                $scope.layerRDF = function(ds, layer) {
                    if (ds.type == "ckan") {
                        return "#"
                    } else if (ds.type == "micka") {
                        return ds.url + "?request=GetRecordById&id=" + layer.id + "&outputschema=http://www.w3.org/ns/dcat#"
                    }

                    return "#"
                }

                $scope.addLayerToMap = function(ds, layer) {
                    if (ds.type == "datatank") {
                        if (layer.type == "shp") {
                            var src = new ol.source.KML({
                                url: ds.url + '/../../' + layer.path + '.kml',
                                projection: ol.proj.get('EPSG:3857'),
                                extractStyles: false
                            });
                            var lyr = new ol.layer.Vector({
                                title: layer.title || layer.description,
                                source: src,
                                style: default_style
                            });
                            var listenerKey = src.on('change', function() {
                                if (src.getState() == 'ready') {
                                    var extent = src.getExtent();
                                    src.unByKey(listenerKey);
                                    if (!isNaN(extent[0]) && !isNaN(extent[1]) && !isNaN(extent[2]) && !isNaN(extent[3]))
                                        OlMap.map.getView().fit(extent, map.getSize());
                                }
                            });
                            OlMap.map.addLayer(lyr);
                            Core.setMainPanel('layermanager');
                        }
                    }
                    if (ds.type == "ckan") {
                        if (["kml", "geojson", "json"].indexOf(layer.format.toLowerCase()) > -1) {
                            var format;
                            var definition = {};
                            var url = layer.url;
                            definition.url = layer.url;
                            url = utils.proxify(url);
                            switch (layer.format.toLowerCase()) {
                                case "kml":
                                    format = new ol.format.KML();
                                    definition.format = "ol.format.KML";
                                    break;
                                case "json":
                                case "geojson":
                                    format = new ol.format.GeoJSON();
                                    definition.format = "ol.format.GeoJSON";
                                    break;
                            }
                            var src = new ol.source.Vector({
                                format: format,
                                url: url,
                                projection: ol.proj.get('EPSG:3857'),
                                extractStyles: false,
                                loader: function(extent, resolution, projection) {
                                    $.ajax({
                                        url: url,
                                        success: function(data) {
                                            src.addFeatures(format.readFeatures(data, {
                                                dataProjection: 'EPSG:4326',
                                                featureProjection: map.getView().getProjection().getCode().toUpperCase()
                                            }));
                                        }
                                    })
                                },
                                strategy: ol.loadingstrategy.all
                            });
                            var lyr = new ol.layer.Vector({
                                title: layer.title || layer.description,
                                source: src,
                                definition: definition,
                                saveState: true,
                                style: default_style
                            });
                            var listenerKey = src.on('change', function() {
                                if (src.getState() == 'ready') {
                                    if (src.getFeatures().length == 0) return;
                                    var extent = src.getExtent();
                                    src.unByKey(listenerKey);
                                    if (!isNaN(extent[0]) && !isNaN(extent[1]) && !isNaN(extent[2]) && !isNaN(extent[3]))
                                        OlMap.map.getView().fit(extent, map.getSize());
                                }
                            });
                            OlMap.map.addLayer(lyr);
                            Core.setMainPanel('layermanager');
                        }
                    }
                    if (ds.type == "micka") {
                        if (layer.trida == 'service') {
                            if (layer.serviceType == 'WMS' || layer.serviceType == 'OGC:WMS' || layer.serviceType == 'view') {
                                if (Core.singleDatasources) {
                                    $('.dss-tabs a[href="#OWS"]').tab('show')
                                } else {
                                    Core.setMainPanel('ows');
                                }
                                var link = layer.link;
                                hslayers_api.gui.Ows.setUrlAndConnect(decodeURIComponent(link));
                            } else {
                                alert('Service type "' + layer.serviceType + '" not supported.');
                            }
                        } else if (layer.trida == 'dataset') {
                            if (["kml", "geojson", "json"].indexOf(layer.format.toLowerCase()) > -1) {
                                var format;
                                var definition = {};
                                var url = layer.link;
                                definition.url = layer.link;
                                url = utils.proxify(url);
                                switch (layer.format.toLowerCase()) {
                                    case "kml":
                                        format = new ol.format.KML();
                                        definition.format = "ol.format.KML";
                                        break;
                                    case "json":
                                    case "geojson":
                                        format = new ol.format.GeoJSON();
                                        definition.format = "ol.format.GeoJSON";
                                        break;
                                }
                                var src = new ol.source.Vector({
                                    format: format,
                                    url: url,
                                    projection: ol.proj.get('EPSG:3857'),
                                    extractStyles: true,
                                    loader: function(extent, resolution, projection) {
                                        $.ajax({
                                            url: url,
                                            success: function(data) {
                                                src.addFeatures(format.readFeatures(data, {
                                                    dataProjection: 'EPSG:4326',
                                                    featureProjection: map.getView().getProjection().getCode().toUpperCase()
                                                }));
                                            }
                                        })
                                    },
                                    strategy: ol.loadingstrategy.all
                                });
                                var lyr = new ol.layer.Vector({
                                    title: layer.title || layer.description,
                                    source: src,
                                    definition: definition,
                                    saveState: true
                                });
                                var listenerKey = src.on('change', function() {
                                    if (src.getState() == 'ready') {
                                        if (src.getFeatures().length == 0) return;
                                        var extent = src.getExtent();
                                        src.unByKey(listenerKey);
                                        if (!isNaN(extent[0]) && !isNaN(extent[1]) && !isNaN(extent[2]) && !isNaN(extent[3]))
                                            OlMap.map.getView().fit(extent, map.getSize());
                                    }
                                });
                                OlMap.map.addLayer(lyr);
                                Core.setMainPanel('layermanager');
                            }
                        } else {
                            alert('Datasource type "' + layer.trida + '" not supported.');
                        }
                    }
                }

                $scope.highlightComposition = function(composition, state) {
                    if (typeof composition.feature !== 'undefined')
                        composition.feature.set('highlighted', state)
                }

                $scope.clear = function() {
                    $scope.query.text_filter = "";
                    $scope.query.title = "";
                    $scope.query.keywords = "";
                    $scope.query.OrganisationName = "";
                    $scope.query.sortby = "";
                }

                $scope.datasources = config.datasources;

                $scope.init = function() {
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
                        if ($scope.filter_by_extent) $scope.loadDatasets($scope.datasources);
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

                $scope.init();
            }
        ]);

    });
