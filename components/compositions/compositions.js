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
                        /* TODO: This should be done more angular way */
                        //$('.mid-pane').prepend($('<div></div>').addClass('composition-info'));
                        $('.mid-pane').css('margin-top', '0px');
                        $(".keywords-panel").hide();
                    }
                };
            })
            .directive('hs.compositions.overwriteDialogDirective', function() {
                return {
                    templateUrl: hsl_path + 'components/compositions/partials/dialog_overwriteconfirm.html',
                    link: function(scope, element, attrs) {
                        $('#composition-overwrite-dialog').modal('show');
                    }
                };
            })

        .directive('hs.compositions.deleteDialogDirective', function() {
            return {
                templateUrl: hsl_path + 'components/compositions/partials/dialog_delete.html',
                link: function(scope, element, attrs) {
                    $('#composition-delete-dialog').modal('show');
                }
            };
        })

        .directive('hs.compositions.shareDialogDirective', function() {
            return {
                templateUrl: hsl_path + 'components/compositions/partials/dialog_share.html',
                link: function(scope, element, attrs) {
                    $('#composition-share-dialog').modal('show');
                }
            };
        })

        .directive('hs.compositions.infoDialogDirective', function() {
            return {
                templateUrl: hsl_path + 'components/compositions/partials/dialog_info.html',
                link: function(scope, element, attrs) {
                    $('#composition-info-dialog').modal('show');
                }
            };
        })

        .service('hs.compositions.service_parser', ['hs.map.service', 'config', 'Core', '$rootScope', 'hs.utils.service', function(OlMap, config, Core, $rootScope, utils) {
            var me = {
                composition_loaded: null,
                composition_edited: false,
                current_composition_title: "",
                load: function(url, overwrite, callback) {
                    url = url.replace('&amp;', '&');
                    url = utils.proxify(url);
                    $.ajax({
                            url: url
                        })
                        .done(function(response) {
                            me.composition_loaded = url;
                            if (angular.isUndefined(overwrite) || overwrite == true) {
                                var to_be_removed = [];
                                OlMap.map.getLayers().forEach(function(lyr) {
                                    if (lyr.get('from_composition'))
                                        to_be_removed.push(lyr);
                                });
                                while (to_be_removed.length > 0) {
                                    OlMap.map.removeLayer(to_be_removed.shift());
                                }
                            }
                            me.current_composition_title = response.title || response.data.title;
                            OlMap.map.getView().fit(me.parseExtent(response.extent || response.data.extent), OlMap.map.getSize());
                            var layers = me.jsonToLayers(response);
                            for (var i = 0; i < layers.length; i++) {
                                OlMap.map.addLayer(layers[i]);
                            }


                            if (config.open_lm_after_comp_loaded) {
                                Core.setMainPanel('layermanager');
                            }

                            me.composition_edited = false;
                            $rootScope.$broadcast('compositions.composition_loaded', response);
                            if (typeof callback !== 'undefined' && callback !== null) callback();
                        })
                },

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

                parseExtent: function(b) {
                    if (typeof b == 'string')
                        b = b.split(" ");
                    var first_pair = [parseFloat(b[0]), parseFloat(b[1])]
                    var second_pair = [parseFloat(b[2]), parseFloat(b[3])];
                    first_pair = ol.proj.transform(first_pair, 'EPSG:4326', OlMap.map.getView().getProjection());
                    second_pair = ol.proj.transform(second_pair, 'EPSG:4326', OlMap.map.getView().getProjection());
                    return [first_pair[0], first_pair[1], second_pair[0], second_pair[1]];
                },
                parseStyle: function(j) {
                    var style_json = {};
                    if (angular.isDefined(j.fill)) {
                        style_json.fill = new ol.style.Fill({
                            color: j.fill
                        })
                    }
                    if (angular.isDefined(j.stroke)) {
                        style_json.stroke = new ol.style.Stroke({
                            color: j.stroke.color,
                            width: j.stroke.width
                        })
                    }
                    if (angular.isDefined(j.image)) {
                        if (j.image.type == 'circle') {
                            var circle_json = {};

                            if (angular.isDefined(j.image.radius)) {
                                circle_json.radius = j.image.radius;
                            }

                            if (angular.isDefined(j.image.fill)) {
                                circle_json.fill = new ol.style.Fill({
                                    color: j.image.fill
                                });
                            }
                            if (angular.isDefined(j.image.stroke)) {
                                circle_json.stroke = new ol.style.Stroke({
                                    color: j.image.stroke.color,
                                    width: j.image.stroke.width
                                })
                            }
                            style_json.image = new ol.style.Circle(circle_json);
                        }
                        if (j.image.type == 'icon') {
                            var img = new Image();
                            img.src = j.image.src;
                            var icon_json = {
                                img: img,
                                imgSize: [img.width, img.height],
                                crossOrigin: 'anonymous'
                            };
                            style_json.image = new ol.style.Icon(icon_json);
                        }
                    }
                    return new ol.style.Style(style_json);
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
                                        url: decodeURIComponent(lyr_def.url),
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
                                var definition = {};
                                if (lyr_def.protocol && lyr_def.protocol.format == 'ol.format.KML') {
                                    var url = decodeURIComponent(lyr_def.protocol.url);
                                    url = utils.proxify(url);

                                    definition.url = url;
                                    definition.format = "ol.format.KML";

                                    var style = null;
                                    if (angular.isDefined(lyr_def.style)) style = me.parseStyle(lyr_def.style);

                                    var src = new ol.source.Vector({
                                        format: new ol.format.KML(),
                                        projection: ol.proj.get(lyr_def.projection),
                                        url: url,
                                        extractStyles: (style != null ? false : true)
                                    })
                                    var lyr = new ol.layer.Vector({
                                        from_composition: true,
                                        definition: definition,
                                        source: src,
                                        style: style,
                                        title: lyr_def.title
                                    });

                                    if (style != null) {
                                        src.on('addfeature', function(f) {
                                            f.feature.setStyle(null);
                                        });
                                    }

                                    layers.push(lyr);
                                } else if (lyr_def.protocol && lyr_def.protocol.format == 'ol.format.GeoJSON') {
                                    var url = decodeURIComponent(lyr_def.protocol.url);
                                    url = utils.proxify(url);

                                    definition.url = url;
                                    definition.format = "ol.format.GeoJSON";

                                    var style = null;
                                    if (angular.isDefined(lyr_def.style)) style = me.parseStyle(lyr_def.style);

                                    var src = new ol.source.Vector({
                                        format: new ol.format.GeoJSON(),
                                        projection: ol.proj.get(lyr_def.projection),
                                        url: url,
                                        extractStyles: (style != null ? false : true)
                                    })
                                    var lyr = new ol.layer.Vector({
                                        from_composition: true,
                                        definition: definition,
                                        source: src,
                                        style: style,
                                        title: lyr_def.title
                                    });
                                    layers.push(lyr);
                                } else if (angular.isUndefined(lyr_def.protocol) && angular.isDefined(lyr_def.features)) {
                                    var format = new ol.format.GeoJSON();
                                    var src = new ol.source.Vector({
                                        features: format.readFeatures(lyr_def.features),
                                        projection: ol.proj.get(lyr_def.projection)
                                    });
                                    var style = null;
                                    if (angular.isDefined(lyr_def.style)) style = me.parseStyle(lyr_def.style);
                                    var lyr = new ol.layer.Vector({
                                        from_composition: true,
                                        source: src,
                                        title: lyr_def.title,
                                        style: style
                                    });
                                    layers.push(lyr);
                                }
                                break;
                        }

                    }
                    return layers;
                }
            };
            return me;
        }])

        .controller('hs.compositions.controller', ['$scope', '$rootScope', '$location', 'hs.map.service', 'Core', 'hs.compositions.service_parser', 'config', 'hs.permalink.service_url', '$compile', '$cookies', 'hs.utils.service',
            function($scope, $rootScope, $location, OlMap, Core, composition_parser, config, permalink, $compile, $cookies, utils) {
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
                $scope.use_callback_for_edit = false; //Used for opening Edit panel from the list of compositions

                var ajax_req = null;
                $scope.loadCompositions = function(page) {
                    if (typeof page === 'undefined') page = 1;
                    if ($scope.page_count == 0) $scope.page_count = 1;
                    if (page == 0 || page > $scope.page_count) return;
                    extent_layer.getSource().clear();
                    $scope.current_page = page;
                    $scope.first_composition_ix = (page - 1) * $scope.page_size;
                    var text_filter = $scope.query && angular.isDefined($scope.query.title) && $scope.query.title != '' ? encodeURIComponent(" AND AnyText like '*" + $scope.query.title + "*'") : '';
                    var keyword_filter = "";
                    var selected = [];
                    angular.forEach($scope.keywords, function(value, key) {
                        if (value) selected.push("subject='" + key + "'");
                    });
                    if (selected.length > 0)
                        keyword_filter = encodeURIComponent(' AND (' + selected.join(' OR ') + ')');
                    var cur_map_extent = OlMap.map.getView().calculateExtent(OlMap.map.getSize());
                    var b = ol.proj.transformExtent(cur_map_extent, OlMap.map.getView().getProjection(), 'EPSG:4326');
                    var bbox_delimiter = config.compositions_catalogue_url.indexOf('cswClientRun.php') > 0 ? ',' : ' ';
                    var serviceName = config.compositions_catalogue_url.indexOf('cswClientRun.php') > 0 ? 'serviceName=p4b&' : '';
                    var bbox = ($scope.filter_by_extent ? encodeURIComponent(" and BBOX='" + b.join(bbox_delimiter) + "'") : '');
                    var url = config.compositions_catalogue_url + "?format=json&" + serviceName + "query=type%3Dapplication" + bbox + text_filter + keyword_filter + "&lang=eng&sortBy=bbox&detail=summary&start=" + $scope.first_composition_ix + "&page=1&limit=" + $scope.page_size;
                    url = utils.proxify(url);
                    if (ajax_req != null) ajax_req.abort();
                    ajax_req = $.ajax({
                            url: url
                        })
                        .done(function(response) {
                            ajax_req = null;
                            $('.tooltip').remove();
                            $scope.compositions = response.records;
                            $scope.pages = [];
                            $scope.page_count = Math.ceil(response.matched / $scope.page_size);
                            if (response.matched > response.returned) {
                                for (var i = 1; i <= Math.ceil(response.matched / $scope.page_size); i++)
                                    $scope.pages.push(i);
                            }
                            angular.forEach($scope.compositions, function(record) {
                                var attributes = {
                                    record: record,
                                    hs_notqueryable: true,
                                    highlighted: false
                                };
                                record.editable = false;
                                var extent = composition_parser.parseExtent(record.bbox);
                                //Check if height or Width covers the whole screen
                                if (!((extent[0] < cur_map_extent[0] && extent[2] > cur_map_extent[2]) || (extent[1] < cur_map_extent[1] && extent[3] > cur_map_extent[3]))) {
                                    attributes.geometry = ol.geom.Polygon.fromExtent(extent);
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
                }

                $scope.loadStatusManagerCompositions = function(bbox) {
                    var url = config.status_manager_url;
                    var text_filter = $scope.query && angular.isDefined($scope.query.title) && $scope.query.title != '' ? encodeURIComponent('&title=' + $scope.query.title) : '';
                    url += '?request=list&project=' + encodeURIComponent(config.project_name) + '&extent=' + bbox.join(',') + text_filter + '&start=0&limit=1000&sort=%5B%7B%22property%22%3A%22title%22%2C%22direction%22%3A%22ASC%22%7D%5D';
                    url = utils.proxify(url);
                    ajax_req = $.ajax({
                            url: url,
                            cache: false
                        })
                        .done(function(response) {
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
                                        record.link = config.status_manager_url + '?request=load&id=' + record.id;
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
                                    }
                                }
                            });
                            if (!$scope.$$phase) $scope.$digest();
                        })
                }

                $scope.filterChanged = function() {
                    if (angular.isDefined($scope.query.editable) && $scope.query.editable == false) delete $scope.query.editable;
                }

                $scope.confirmDelete = function(composition) {
                    $scope.compositionToDelete = composition;
                    if (!$scope.$$phase) $scope.$digest();
                    $("#hs-dialog-area #composition-delete-dialog").remove();
                    var el = angular.element('<div hs.compositions.delete_dialog_directive></span>');
                    $("#hs-dialog-area").append(el)
                    $compile(el)($scope);
                }

                $scope.delete = function(composition) {
                    var url = config.status_manager_url + '?request=delete&id=' + composition.id + '&project=' + encodeURIComponent(config.project_name);
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

                $scope.edit = function(composition) {
                    $scope.use_callback_for_edit = true;
                    $scope.loadComposition(composition);
                }

                function callbackForEdit() {
                    Core.openStatusCreator();
                }

                $scope.highlightComposition = function(composition, state) {
                    if (angular.isDefined(composition.feature))
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

                $rootScope.$on('compositions.composition_edited', function(event) {
                    composition_parser.composition_edited = true;
                });

                $rootScope.$on('infopanel.feature_selected', function(event, feature, selector) {
                    var record = feature.get("record");
                    $scope.use_callback_for_edit = false;
                    feature.set('highlighted', false);
                    selector.getFeatures().clear();
                    $scope.loadComposition(record);
                });

                $scope.$on('map.extent_changed', function(event, data, b) {
                    if ($scope.filter_by_extent) $scope.loadCompositions();
                });

                $scope.shareComposition = function(record) {
                    $scope.shareUrl = $location.protocol() + "://" + location.host + location.pathname + "?composition=" + encodeURIComponent(record.link);
                    $scope.shareTitle = record.title;
                    if (!$scope.$$phase) $scope.$digest();
                    $("#hs-dialog-area #composition-share-dialog").remove();
                    var el = angular.element('<div hs.compositions.share_dialog_directive></span>');
                    $("#hs-dialog-area").append(el)
                    $compile(el)($scope);
                }

                $scope.detailComposition = function(record) {
                    $scope.info = composition_parser.loadInfo(record.link);

                    if (!$scope.$$phase) $scope.$digest();
                    $("#hs-dialog-area #composition-info-dialog").remove();
                    var el = angular.element('<div hs.compositions.info_dialog_directive></span>');
                    $("#hs-dialog-area").append(el)
                    $compile(el)($scope);
                }

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

                $scope.overwrite = function() {
                    composition_parser.load($scope.composition_to_be_loaded, true, $scope.use_callback_for_edit ? callbackForEdit : null);
                }

                $scope.add = function() {
                    composition_parser.load($scope.composition_to_be_loaded, false, $scope.use_callback_for_edit ? callbackForEdit : null);
                }

                $scope.save = function() {
                    Core.openStatusCreator();
                }

                //$scope.loadCompositions();
                $scope.toggleKeywords = function() {
                    $(".keywords-panel").slideToggle();
                }
                if (permalink.getParamValue('composition')) {
                    var id = permalink.getParamValue('composition');
                    if (id.indexOf('http') == -1 && id.indexOf('statusmanager2') == -1)
                        id = '/wwwlibs/statusmanager2/index.php?request=load&id=' + id;
                    composition_parser.load(id);
                }

                $scope.$on('core.map_reset', function(event, data) {
                    composition_parser.composition_loaded = null;
                });
                $scope.$emit('scope_loaded', "Compositions");
                $rootScope.$on('core.mainpanel_changed', function(event) {
                    extent_layer.setVisible(Core.panelVisible($scope.panel_name, $scope));
                    if (Core.mainpanel == 'composition_browser') $scope.loadCompositions();
                });
            }
        ]);

    })
