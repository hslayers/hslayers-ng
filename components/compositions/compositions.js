/**
 * @namespace hs.compositions
 * @memberOf hs
 */

define(['angular', 'ol', 'map'],

    function(angular, ol) {
        var module = angular.module('hs.compositions', ['hs.map', 'hs.core'])
            .directive('hs.compositions.directive', function() {
                return {
                    templateUrl: hsl_path + 'components/compositions/partials/compositions.html',
                    link: function(scope, element) {

                    }
                };
            })

        .service('hs.compositions.service_parser', ['hs.map.service', 'Core', function(OlMap, Core) {
            var me = {
                load: function(url) {
                    url = url.replace('&amp;', '&');
                    if (typeof use_proxy === 'undefined' || use_proxy === true) {
                        url = "/cgi-bin/hsproxy.cgi?toEncoding=utf-8&url=" + window.escape(url);
                    } else {
                        url = url;
                    }
                    $.ajax({
                            url: url
                        })
                        .done(function(response) {
                            OlMap.map.getLayers().forEach(function(lyr) {
                                if (lyr.get('from_composition')) {
                                    OlMap.map.removeLayer(lyr);
                                }
                            });
                            OlMap.map.getView().fitExtent(me.parseExtent(response.extent || response.data.extent), OlMap.map.getSize());
                            var layers = me.jsonToLayers(response);
                            for (var i = 0; i < layers.length; i++) {
                                OlMap.map.addLayer(layers[i]);
                            }
                            Core.setMainPanel('layermanager');
                        })
                },
                parseExtent: function(b) {
                    if (typeof b == 'string')
                        b = b.split(" ");
                    var first_pair = [parseFloat(b[0]), parseFloat(b[1])]
                    var second_pair = [parseFloat(b[2]), parseFloat(b[3])];
                    first_pair = ol.proj.transform(first_pair, 'EPSG:4326', OlMap.map.getView().getProjection());
                    second_pair = ol.proj.transform(second_pair, 'EPSG:4326', OlMap.map.getView().getProjection());
                    return [first_pair[0], first_pair[1], second_pair[0], second_pair[1]];
                },
                jsonToLayers: function(j) {
                    var layers = [];
                    if (j.data) j = j.data;
                    for (var i = 0; i < j.layers.length; i++) {
                        var lyr_def = j.layers[i];
                        switch (lyr_def.className) {
                            case "HSLayers.Layer.WMS":
                                var source_class = lyr_def.singleTile ? ol.source.ImageWMS : ol.source.TileWMS;
                                var layer_class = lyr_def.singleTile ? ol.layer.Image : ol.layer.Tile;
                                var params = lyr_def.params;
                                delete params.REQUEST;
                                delete params.FORMAT;
                                var new_layer = new layer_class({
                                    title: lyr_def.title,
                                    from_composition: true,
                                    maxResolution: lyr_def.maxResolution,
                                    minResolution: lyr_def.minResolution,
                                    minScale: lyr_def.minScale,
                                    maxScale: lyr_def.maxScale,
                                    show_in_manager: lyr_def.displayInLayerSwitcher,
                                    abstract: lyr_def.name,
                                    metadata: lyr_def.metadata,
                                    saveState: true,
                                    source: new source_class({
                                        url: lyr_def.url,
                                        attributions: lyr_def.attribution ? [new ol.Attribution({
                                            html: '<a href="' + lyr_def.attribution.OnlineResource + '">' + lyr_def.attribution.Title + '</a>'
                                        })] : undefined,
                                        styles: lyr_def.metadata.styles,
                                        params: params,
                                        crossOrigin: 'anonymous',
                                        projection: lyr_def.projection,
                                        ratio: lyr_def.ratio,
                                        crossOrigin: null
                                    })
                                });
                                layers.push(new_layer);
                                break;
                            case 'OpenLayers.Layer.Vector':
                                if (lyr.protocol && lyr.protocol.format.className == 'OpenLayers.Format.KML') {
                                    var url = lyr.protocol.optoions.url;
                                    if (typeof use_proxy === 'undefined' || use_proxy === true) {
                                        url = "/cgi-bin/hsproxy.cgi?toEncoding=utf-8&url=" + encodeURIComponent(url);
                                    }
                                    var src = new ol.source.KML({
                                        projection: ol.proj.get(lyr.projection),
                                        url: url,
                                        extractStyles: true
                                    })
                                    var lyr = new ol.layer.Vector({
                                        title: lyr.title,
                                        source: src
                                    });
                                }
                                break;
                        }

                    }
                    return layers;
                }
            };
            return me;
        }])

        .controller('hs.compositions.controller', ['$scope', '$rootScope', 'hs.map.service', 'Core', 'hs.compositions.service_parser', 'compositions_catalogue_url',
            function($scope, $rootScope, OlMap, Core, composition_parser, compositions_catalogue_url) {
                $scope.page_size = 15;
                $scope.page_count = 1000;
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
                $scope.filter_by_extent = true;

                var ajax_req = null;
                $scope.loadCompositions = function(page) {
                    if (typeof page === 'undefined') page = 1;
                    if ($scope.page_count == 0) $scope.page_count = 1;
                    if (page == 0 || page > $scope.page_count) return;
                    extent_layer.getSource().clear();
                    $scope.current_page = page;
                    $scope.first_composition_ix = (page - 1) * $scope.page_size;
                    var text_filter = $scope.query && $scope.query.title != '' ? encodeURIComponent(" AND AnyText like '*" + $scope.query.title + "*'") : '';
                    var keyword_filter = "";
                    var selected = [];
                    angular.forEach($scope.keywords, function(value, key) {
                        if (value) selected.push("subject='" + key + "'");
                    });
                    if (selected.length > 0)
                        keyword_filter = encodeURIComponent(' AND (' + selected.join(' OR ') + ')');
                    var b = ol.proj.transformExtent(OlMap.map.getView().calculateExtent(OlMap.map.getSize()), OlMap.map.getView().getProjection(), 'EPSG:4326');
                    var bbox_delimiter = compositions_catalogue_url.indexOf('cswClientRun.php') > 0 ? ',' : ' ';
                    var bbox = ($scope.filter_by_extent ? encodeURIComponent(" and BBOX='" + b.join(bbox_delimiter) + "'") : '');
                    var url = compositions_catalogue_url + "?format=json&serviceName=p4b&query=type%3Dapplication" + bbox + text_filter + keyword_filter + "&lang=eng&sortBy=bbox&detail=summary&start=" + $scope.first_composition_ix + "&page=1&limit=" + $scope.page_size;
                    if (typeof use_proxy === 'undefined' || use_proxy === true) {
                        url = "/cgi-bin/hsproxy.cgi?toEncoding=utf-8&url=" + encodeURIComponent(url);
                    } else {
                        url = url;
                    }
                    if (ajax_req != null) ajax_req.abort();
                    ajax_req = $.ajax({
                            url: url
                        })
                        .done(function(response) {
                            ajax_req = null;
                            $scope.compositions = response.records;
                            $scope.pages = [];
                            $scope.page_count = Math.ceil(response.matched / $scope.page_size);
                            if (response.matched > response.returned) {
                                for (var i = 1; i <= Math.ceil(response.matched / $scope.page_size); i++)
                                    $scope.pages.push(i);
                            }
                            $(response.records).each(function() {
                                var attributes = {
                                    record: this,
                                    hs_notqueryable: true,
                                    highlighted: false
                                };
                                var extent = composition_parser.parseExtent(this.bbox);
                                attributes.geometry = ol.geom.Polygon.fromExtent(extent);
                                var new_feature = new ol.Feature(attributes);
                                this.feature = new_feature;
                                extent_layer.getSource().addFeatures([new_feature]);
                            })
                            if (!$scope.$$phase) $scope.$digest();
                            $('[data-toggle="tooltip"]').tooltip();
                        })
                }

                $scope.highlightComposition = function(composition, state) {
                    composition.feature.set('highlighted', state)
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

                var extent_layer = new ol.layer.Vector({
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

                OlMap.map.addLayer(extent_layer);

                var timer;
                OlMap.map.getView().on('change:center', function(e) {
                    if (timer != null) clearTimeout(timer);
                    timer = setTimeout(function() {
                        if ($scope.filter_by_extent) $scope.loadCompositions();
                    }, 500);
                });
                OlMap.map.getView().on('change:resolution', function(e) {
                    if (timer != null) clearTimeout(timer);
                    timer = setTimeout(function() {
                        if ($scope.filter_by_extent) $scope.loadCompositions();
                    }, 500);
                });

                $scope.loadComposition = composition_parser.load;
                $scope.loadCompositions();
                $scope.toggleKeywords = function() {
                    $(".keywords-panel").slideToggle();
                }
                $scope.$emit('scope_loaded', "Compositions");
                $scope.$on('core.mainpanel_changed', function(event) {
                    extent_layer.setVisible(Core.panelVisible($scope.panel_name, $scope));
                });
            }
        ]);

    })
