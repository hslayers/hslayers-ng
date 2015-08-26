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

        .controller('hs.datasource_selector.controller', ['$scope', 'hs.map.service', 'Core', '$compile',
            function($scope, OlMap, Core, $compile) {
                $scope.query = {
                    text_filter: ''
                };
                $scope.text_field = "AnyText";
                $scope.panel_name = 'datasource_selector';
                $scope.ajax_loader = hsl_path + 'components/datasource_selector/ajax-loader.gif';
                $scope.selected_layer = null;
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
                            if (typeof use_proxy === 'undefined' || use_proxy === true) {
                                url = "/cgi-bin/hsproxy.cgi?toEncoding=utf-8&url=" + encodeURIComponent(url);
                            }
                            if (typeof ds.code_lists == 'undefined') {
                                ds.code_lists = {
                                    serviceType: [],
                                    applicationType: [],
                                    dataType: [],
                                    topicCategory: []
                                }
                            }
                            ds.ajax_req = $.ajax({
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
                                }
                            });
                            break;
                    }
                }

                $scope.advancedMickaTypeChanged = function() {
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
                    var el = angular.element('<div hs.datasource_selector.advanced_micka_dialog_directive></span>');
                    $("#hs-dialog-area").append(el)
                    $compile(el)($scope);
                    if (typeof $scope.micka_ds == 'undefined') {
                        for (var ds in $scope.datasets) {
                            if ($scope.datasets[ds].type == 'micka') {
                                $scope.micka_ds = $scope.datasets[ds];
                            }
                        }
                    }
                }

                $scope.loadDataset = function(ds) {
                    switch (ds.type) {
                        case "datatank":
                            var url = '';
                            if (typeof use_proxy === 'undefined' || use_proxy === true) {
                                url = "/cgi-bin/hsproxy.cgi?toEncoding=utf-8&url=" + encodeURIComponent(ds.url);
                            } else {
                                url = ds.url;
                            }
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
                                            obj.path = lyr;
                                            ds.layers.push(obj);
                                        }
                                    }
                                    ds.matched = ds.layers.length;
                                    if (!$scope.$$phase) $scope.$digest();
                                }
                            });
                            break;
                        case "micka":
                            var b = ol.proj.transformExtent(OlMap.map.getView().calculateExtent(OlMap.map.getSize()), OlMap.map.getView().getProjection(), 'EPSG:4326');
                            var bbox = "and BBOX='" + b[0] + " " + b[1] + " " + b[2] + " " + b[3] + "'";
                            var ue = encodeURIComponent;
                            var query = $scope.text_field + ue(" like '*" + $scope.query.text_filter + "*'") + param2Query('type') + param2Query('ServiceType') + param2Query('topicCategory') + param2Query('Denominator');
                            var url = ds.url + '?request=GetRecords&format=application/json&language=' + ds.language +
                                '&query=' + query +
                                (typeof $scope.query.sortby != 'undefined' && $scope.query.sortby != '' ? '&sortby=' + $scope.query.sortby : '') +
                                '&limit=10&start=' + ds.start;
                            if (typeof use_proxy === 'undefined' || use_proxy === true) {
                                url = "/cgi-bin/hsproxy.cgi?toEncoding=utf-8&url=" + ue(url);
                            }
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
                                    ds.matched = j.matched;
                                    ds.next = j.next;
                                    for (var lyr in j.records) {
                                        if (j.records[lyr]) {
                                            var obj = j.records[lyr];
                                            ds.layers.push(obj);
                                            addExtentFeature(obj);
                                        }
                                    }
                                    if (!$scope.$$phase) $scope.$digest();
                                }
                            });
                            break;
                    }
                }

                function param2Query(which) {
                    if (typeof $scope.query[which] != 'undefined') {
                        if (which == 'type' && $scope.query[which] == 'data') {
                            //Special case for type 'data' because it can contain many things
                            return encodeURIComponent(" and (type='dataset' OR type='nonGeographicDataset' OR type='series' OR type='tile')");
                        }
                        return ($scope.query[which] != '' ? encodeURIComponent(" and " + which + "='" + $scope.query[which] + "'") : '')
                    } else return '';
                }

                $scope.zoomTo = function(bbox) {
                    var b = bbox.split(" ");
                    var first_pair = [parseFloat(b[0]), parseFloat(b[1])];
                    var second_pair = [parseFloat(b[2]), parseFloat(b[3])];
                    first_pair = ol.proj.transform(first_pair, 'EPSG:4326', OlMap.map.getView().getProjection());
                    second_pair = ol.proj.transform(second_pair, 'EPSG:4326', OlMap.map.getView().getProjection());
                    if (isNaN(first_pair[0]) || isNaN(first_pair[1]) || isNaN(second_pair[0]) || isNaN(second_pair[1])) return;
                    var extent = [first_pair[0], first_pair[1], second_pair[0], second_pair[1]];
                    OlMap.map.getView().fitExtent(extent, OlMap.map.getSize());
                }

                $scope.getPreviousRecords = function(ds) {
                    ds.start -= 10;
                    $scope.loadDataset(ds);
                }

                $scope.getNextRecords = function(ds) {
                    ds.start = ds.next;
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
                                        OlMap.map.getView().fitExtent(extent, map.getSize());
                                }
                            });
                            OlMap.map.addLayer(lyr);
                            Core.setMainPanel('layermanager');
                        }
                    }
                    if (ds.type == "micka") {
                        if (layer.trida == 'service') {
                            if (layer.serviceType == 'WMS' || layer.serviceType == 'OGC:WMS' || layer.serviceType == 'view') {
                                Core.setMainPanel('ows');
                                var link = layer.link;
                                link = link.split("?")[0];
                                hslayers_api.gui.Ows.setUrlAndConnect(decodeURIComponent(link));
                            } else {
                                alert('Service type "' + layer.serviceType + '" not supported.');
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
                }

                OlMap.map.addLayer(extent_layer);
                $scope.datasources = [{
                    title: "Datatank",
                    url: "http://ewi.mmlab.be/otn/api/info",
                    type: "datatank"
                }, {
                    title: "Micka",
                    url: "http://cat.ccss.cz/csw/",
                    language: 'eng',
                    type: "micka",
                    code_list_url: 'http://www.whatstheplan.eu/php/metadata/util/codelists.php?_dc=1440156028103&language=eng&page=1&start=0&limit=25&filter=%5B%7B%22property%22%3A%22label%22%7D%5D'
                }];

                $scope.loadDatasets($scope.datasources);
                $scope.fillCodesets($scope.datasources);
                $scope.$emit('scope_loaded', "DatasourceSelector");
                $scope.$on('core.mainpanel_changed', function(event) {
                    extent_layer.setVisible(Core.panelVisible($scope.panel_name, $scope));
                });
            }
        ]);

    });
