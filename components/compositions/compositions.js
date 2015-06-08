define(['angular', 'ol', 'map'],

    function(angular, ol) {
        var module = angular.module('hs.compositions', ['hs.map', 'hs.core'])
            .directive('compositionBrowser', function() {
                return {
                    templateUrl: hsl_path + 'components/compositions/partials/compositions.html',
                    link: function(scope, element) {

                    }
                };
            })
            .service('composition_parser', ['OlMap', 'Core', function(OlMap, Core) {
                var me = {
                    load: function(url) {
                        url = "/cgi-bin/hsproxy.cgi?toEncoding=utf-8&url=" + window.escape(url);
                        $.ajax({
                                url: url
                            })
                            .done(function(response) {
                                OlMap.map.getLayers().forEach(function(lyr) {
                                    if (lyr.get('from_composition')) {
                                        OlMap.map.removeLayer(lyr);
                                    }
                                })
                                var layers = me.getLayerDefinitions(response);
                                for (var i = 0; i < layers.length; i++) {
                                    OlMap.map.addLayer(layers[i]);
                                }
                                Core.setMainPanel('layermanager');
                            })
                    },
                    getLayerDefinitions: function(j) {
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
                            }

                        }
                        return layers;
                    }
                };
                return me;
            }])
            .controller('Compositions', ['$scope', '$rootScope', 'OlMap', 'Core', 'composition_parser',
                function($scope, $rootScope, OlMap, Core, composition_parser) {
                    $scope.$emit('scope_loaded', "Compositions");
                    $scope.page_size = 25;
                    $scope.page_count = 1000;
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
                        var url = "http://www.whatstheplan.eu/p4b-dev/cat/catalogue/libs/cswclient/cswClientRun.php?_dc=1433255684347&serviceURL=&project=&serviceName=p4b&format=json&standard=&query=type%3Dapplication%20AND%20BBOX%3D%27-135.70312477249308%2C20.84649058320339%2C164.8828126856566%2C73.109630112712%27" + text_filter + keyword_filter + "&lang=eng&session=save&sortBy=bbox&detail=summary&start=" + $scope.first_composition_ix + "&page=1&limit=" + $scope.page_size;
                        url = "/cgi-bin/hsproxy.cgi?toEncoding=utf-8&url=" + encodeURIComponent(url);
                        $.ajax({
                                url: url
                            })
                            .done(function(response) {
                                if (console) console.log(response);
                                $scope.compositions = response.records;
                                $scope.pages = [];
                                $scope.page_count = Math.ceil(response.matched / $scope.page_size);
                                if (response.matched > response.returned) {
                                    for (var i = 1; i <= Math.ceil(response.matched / $scope.page_size); i++)
                                        $scope.pages.push(i);
                                }
                                $(response.records).each(function() {
                                    var attributes = {record: this, hs_notqueryable: true};
                                    var b = this.bbox.split(" ");
                                    var first_pair = [parseFloat(b[0]), parseFloat(b[1])]
                                    var second_pair = [parseFloat(b[2]), parseFloat(b[3])];
                                    first_pair = ol.proj.transform(first_pair, 'EPSG:4326', 'EPSG:3857');
                                    second_pair = ol.proj.transform(second_pair, 'EPSG:4326', 'EPSG:3857');
                                    var extent = [first_pair[0], first_pair[1], second_pair[0], second_pair[1]];
                                    attributes.geometry = ol.geom.Polygon.fromExtent(extent);
                                    extent_layer.getSource().addFeatures([new ol.Feature(attributes)]);
                                })
                                if (!$scope.$$phase) $scope.$digest();
                                $('[data-toggle="tooltip"]').tooltip();
                            })
                    }
                    
                    OlMap.map.on('pointermove', function(evt) {
                        var features = extent_layer.getSource().getFeaturesAtCoordinate(evt.coordinate);
                        var something_done = false;
                        $(extent_layer.getSource().getFeatures()).each(function(){
                            if(this.get("record").highlighted) {
                                this.get("record").highlighted = false;
                                something_done = true;
                            }
                        });
                        if (features.length) {
                            $(features).each(function(){
                                if(!this.get("record").highlighted) {
                                    this.get("record").highlighted = true;
                                    something_done = true;
                                }
                            })
                        }
                        if(something_done && !$scope.$$phase) $scope.$digest();
                    });
                    
                    var extent_layer = new ol.layer.Vector({
                        title: "Composition extents",
                        show_in_manager: false,
                        source: new ol.source.Vector(),
                        style: function(feature, resolution) {
                            return [new ol.style.Style({
                                stroke: new ol.style.Stroke({
                                    color: '#005CB6',
                                    width: 1
                                }),
                                fill: new ol.style.Fill({
                                    color: 'rgba(0, 0, 255, 0.01)'
                                })
                            })]
                        }
                    });

                    OlMap.map.addLayer(extent_layer);

                    $scope.loadComposition = composition_parser.load;
                    $scope.loadCompositions();
                    $scope.toggleKeywords = function() {
                        $(".keywords-panel").slideToggle();
                    }
                }
            ]);

    })
