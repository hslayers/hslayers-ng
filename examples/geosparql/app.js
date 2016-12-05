'use strict';

define(['angular', 'ol', 'toolbar', 'layermanager', 'SparqlJson', 'sidebar', 'map', 'ows', 'query', 'search', 'permalink', 'measure', 'legend', 'bootstrap', 'geolocation', 'core', 'datasource_selector', 'api', 'angular-gettext', 'translations', 'compositions', 'status_creator', 'info', 'trip_planner', 'spoi_editor'],

    function(angular, ol, toolbar, layermanager, SparqlJson) {
        var module = angular.module('hs', [
            'hs.sidebar',
            'hs.toolbar',
            'hs.layermanager',
            'hs.map',
            'hs.query',
            'hs.search', 'hs.permalink', 'hs.measure',
            'hs.geolocation', 'hs.core',
            'hs.status_creator',
            'hs.api',
            'hs.ows',
            'gettext',
            'hs.compositions',
            'hs.info',
            'hs.trip_planner',
            'spoi_editor'
        ]);

        module.directive('hs', ['Core', function(Core) {
            return {
                templateUrl: hsl_path + 'hslayers.html',
                link: function(scope, element) {
                    Core.fullScreenMap(element);
                    Core.setMainPanel('layermanager');
                }
            };
        }]);

        var style = function(feature, resolution) {
            if (typeof feature.get('visible') === 'undefined' || feature.get('visible') == true) {
                var s = feature.get('http://www.openvoc.eu/poi#categoryWaze');
                if (typeof s === 'undefined') return;
                s = s.split("#")[1];
                return [
                    new ol.style.Style({
                        image: new ol.style.Icon({
                            anchor: [0.5, 1],
                            src: 'symbolsWaze/' + s + '.svg',
                            crossOrigin: 'anonymous'
                        })
                    })

                ]
            } else {
                return [];
            }
        }

        var styleOSM = function(feature, resolution) {
            if (typeof feature.get('visible') === 'undefined' || feature.get('visible') == true) {
                var s = feature.get('http://www.openvoc.eu/poi#categoryOSM');
                if (typeof s === 'undefined') return;
                s = s.split(".")[1];
                return [
                    new ol.style.Style({
                        image: new ol.style.Icon({
                            anchor: [0.5, 1],
                            src: 'symbols/' + s + '.svg',
                            crossOrigin: 'anonymous'
                        })
                    })
                ]
            } else {
                return [];
            }
        }

        var route_style = function(feature, resolution) {
            return [new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: "rgba(242, 78, 60, 0.9)",
                    width: 2
                })
            })]
        };

        var geoJsonFormat = new ol.format.GeoJSON;
        module.value('config', {
            search_provider: 'sdi4apps_openapi',
            box_layers: [new ol.layer.Group({
                'img': 'osm.png',
                title: 'Base layer',
                layers: [
                    new ol.layer.Tile({
                        source: new ol.source.OSM(),
                        title: "OpenStreetMap",
                        base: true,
                        visible: false,
                        path: 'Roads'
                    }),
                    new ol.layer.Tile({
                        title: "OpenCycleMap",
                        visible: true,
                        base: true,
                        source: new ol.source.OSM({
                            url: 'http://{a-c}.tile.opencyclemap.org/cycle/{z}/{x}/{y}.png'
                        }),
                        path: 'Roads'
                    }),
                    new ol.layer.Tile({
                        title: "MTBMap",
                        visible: false,
                        base: true,
                        source: new ol.source.XYZ({
                            url: 'http://tile.mtbmap.cz/mtbmap_tiles/{z}/{x}/{y}.png'
                        }),
                        path: 'Roads'
                    }),
                    new ol.layer.Tile({
                        title: "OwnTiles",
                        visible: false,
                        base: true,
                        source: new ol.source.XYZ({
                            url: 'http://ct37.sdi4apps.eu/map/{z}/{x}/{y}.png'
                        }),
                        path: 'Roads'
                    })
                ],
            }), new ol.layer.Group({
                'img': 'bicycle-128.png',
                title: 'Tourist info',
                layers: [
                    new ol.layer.Vector({
                        title: "Cycling routes Plzen",
                        source: new ol.source.Vector({
                            format: geoJsonFormat,
                            loader: function(extent, resolution, projection) {
                                var that = this;
                                $.ajax({
                                    url: 'http://ng.hslayers.org/examples/geosparql/plzensky_kraj.geojson',
                                    success: function(data) {
                                        that.addFeatures(geoJsonFormat.readFeatures(data));
                                    }
                                });
                            },
                            strategy: ol.loadingstrategy.all
                        }),
                        style: route_style,
                        visible: false,
                        path: 'Roads/Additional Cycling routes'
                    }),
                    new ol.layer.Vector({
                        title: "Cycling routes Zemgale",
                        source: new ol.source.Vector({
                            format: geoJsonFormat,
                            loader: function(extent, resolution, projection) {
                                var that = this;
                                $.ajax({
                                    url: 'http://ng.hslayers.org/examples/geosparql/zemgale.geojson',
                                    success: function(data) {
                                        that.addFeatures(geoJsonFormat.readFeatures(data));
                                    }
                                });
                            },
                            strategy: ol.loadingstrategy.all
                        }),
                        style: route_style,
                        visible: false,
                        path: 'Roads/Additional Cycling routes'
                    }),
                    new ol.layer.Vector({
                        title: "Tour de LatEst",
                        source: new ol.source.Vector({
                            format: geoJsonFormat,
                            loader: function(extent, resolution, projection) {
                                var that = this;
                                $.ajax({
                                    url: 'http://ng.hslayers.org/examples/geosparql/teourdelatest.geojson',
                                    success: function(data) {
                                        that.addFeatures(geoJsonFormat.readFeatures(data));
                                    }
                                });
                            },
                            strategy: ol.loadingstrategy.all
                        }),
                        style: route_style,
                        visible: false,
                        path: 'Roads/Additional Cycling routes'
                    }),
                    new ol.layer.Vector({
                        title: "A1: the Vltava left-bank cycle route",
                        source: new ol.source.Vector({
                            format: geoJsonFormat,
                            loader: function(extent, resolution, projection) {
                                var that = this;
                                $.ajax({
                                    url: 'http://ng.hslayers.org/examples/geosparql/prague.geojson',
                                    success: function(data) {
                                        that.addFeatures(geoJsonFormat.readFeatures(data));
                                    }
                                });
                            },
                            strategy: ol.loadingstrategy.all
                        }),
                        style: route_style,
                        visible: false,
                        path: 'Roads/Additional Cycling routes'
                    }),
                    new ol.layer.Image({
                        title: "Forest roads",
                        BoundingBox: [{
                            crs: "EPSG:3857",
                            extent: [1405266, 6146786, 2073392, 6682239]
                        }],
                        source: new ol.source.ImageWMS({
                            url: 'http://gis.lesprojekt.cz/cgi-bin/mapserv?map=/home/ovnis/sdi4aps_forest_roads.map',
                            params: {
                                LAYERS: 'forest_roads,haul_roads',
                                INFO_FORMAT: "application/vnd.ogc.gml",
                                FORMAT: "image/png; mode=8bit"
                            },
                            crossOrigin: null
                        }),
                        visible: false,
                        path: 'Roads/Additional Cycling routes'
                    })
                ]
            }), new ol.layer.Group({
                'img': 'partly_cloudy.png',
                title: 'Weather',
                layers: [new ol.layer.Tile({
                        title: "OpenWeatherMap cloud cover",
                        source: new ol.source.XYZ({
                            url: "http://{a-c}.tile.openweathermap.org/map/clouds/{z}/{x}/{y}.png"
                        }),
                        visible: false,
                        opacity: 0.7,
                        path: 'Weather info'
                    }),
                    new ol.layer.Tile({
                        title: "OpenWeatherMap precipitation",
                        source: new ol.source.XYZ({
                            url: "http://{a-c}.tile.openweathermap.org/map/precipitation/{z}/{x}/{y}.png"
                        }),
                        visible: false,
                        opacity: 0.7,
                        path: 'Weather info'
                    }),
                    new ol.layer.Tile({
                        title: "OpenWeatherMap temperature",
                        source: new ol.source.XYZ({
                            url: "http://{a-c}.tile.openweathermap.org/map/temp/{z}/{x}/{y}.png"
                        }),
                        visible: false,
                        opacity: 0.7,
                        path: 'Weather info'
                    })
                ]
            })],
            crossfilterable_layers: [{
                layer_ix: 2,
                attributes: ["http://gis.zcu.cz/poi#category_osm"]
            }],
            default_view: new ol.View({
                center: [1490321.6967438285, 6400602.013496143], //Latitude longitude    to Spherical Mercator
                zoom: 14,
                units: "m"
            }),
            infopanel_template: hsl_path + 'examples/geosparql/infopanel.html'
        });

        module.controller('Main', ['$scope', '$compile', '$filter', 'Core', 'hs.map.service', '$sce', '$http', 'config', 'hs.trip_planner.service', 'hs.permalink.service_url', 'hs.utils.service', 'spoi_editor',
            function($scope, $compile, $filter, Core, OlMap, $sce, $http, config, trip_planner_service, permalink, utils, spoi_editor) {
                if (console) console.log("Main called");
                $scope.hsl_path = hsl_path; //Get this from hslayers.js file
                $scope.Core = Core;

                Core.panelEnabled('compositions', false);
                Core.panelEnabled('ows', false);


                $scope.$on("scope_loaded", function(event, args) {
                    if (args == 'Sidebar') {
                        var el = angular.element('<div hs.trip_planner.directive hs.draggable ng-controller="hs.trip_planner.controller" ng-if="Core.exists(\'hs.trip_planner.controller\')" ng-show="Core.panelVisible(\'trip_planner\', this)"></div>');
                        angular.element('#panelplace').append(el);
                        $compile(el)($scope);

                        var toolbar_button = angular.element('<div hs.trip_planner.toolbar_button_directive></div>');
                        angular.element('.sidebar-list').append(toolbar_button);
                        $compile(toolbar_button)(event.targetScope);
                    }
                    if (args == 'Map') {
                        if (permalink.getParamValue('hs_x') != null) {
                            config.default_view.setCenter([permalink.getParamValue('hs_x'), permalink.getParamValue('hs_y')]);
                            config.default_view.setZoom([permalink.getParamValue('hs_z')]);
                        }
                    }
                })

                $scope.$on('infopanel.updated', function(event) {});

                var pop_div = document.createElement('div');
                document.getElementsByTagName('body')[0].appendChild(pop_div);
                var popup = new ol.Overlay({
                    element: pop_div
                });
                OlMap.map.addOverlay(popup);

                var show_location_weather = true;
                $scope.$on('map_clicked', function(event, data) {
                    if (!show_location_weather) return;
                    var on_features = false;
                    angular.forEach(data.frameState.skippedFeatureUids, function(k) {
                        on_features = true;
                    });
                    if (on_features) return;
                    var coordinate = data.coordinate;
                    var lon_lat = ol.proj.transform(
                        coordinate, 'EPSG:3857', 'EPSG:4326');
                    var url = '';
                    if (typeof use_proxy === 'undefined' || use_proxy === true) {
                        url = "/cgi-bin/hsproxy.cgi?toEncoding=utf-8&url=" + window.escape("http://api.openweathermap.org/data/2.5/weather?APPID=13b627424cd072290defed4216e92baa&lat=" + lon_lat[1] + "&lon=" + lon_lat[0]);
                    } else {
                        url = "http://api.openweathermap.org/data/2.5/weather?lat=" + lon_lat[1] + "&lon=" + lon_lat[0];
                    }

                    $.ajax({
                            url: url
                        })
                        .done(function(response) {
                            if (console) console.log(response);
                            var element = popup.getElement();

                            var hdms = ol.coordinate.toStringHDMS(ol.proj.transform(
                                coordinate, 'EPSG:3857', 'EPSG:4326'));
                            angular.element(element).popover('destroy');
                            var to_trip_button = '<button class="hs-spoi-point-to-trip btn btn-default">Add to trip</button>';
                            var new_point_button = '<div class="btn-group"><button type="button" class="hs-spoi-new-poi btn btn-default dropdown-toggle" data-toggle="dropdown">Add to map  <span class="caret"></span></button><ul id="hs-spoi-new-layer-list" class="dropdown-menu"><li><a href="#">Action</a></li></ul></div>';
                            var content = 'No weather info<br/>' + to_trip_button + new_point_button;
                            if (response.weather) {
                                var wind_row = 'Wind: {0}m/s {1}'.format(response.wind.speed, (response.wind.gust ? ' Gust: {0}m/s'.format(response.wind.gust) : ''));
                                var close_button = '<button type="button" class="close"><span aria-hidden="true">×</span><span class="sr-only" translate>Close</span></button>';
                                var weather = response.weather[0];
                                var cloud = '<img src="http://openweathermap.org/img/w/{0}.png" alt="{1}"/>{2}'.format(weather.icon, weather.description, weather.description);
                                var temp_row = 'Temperature: ' + (response.main.temp - 273.15).toFixed(1) + ' °C';
                                var date_row = $filter('date')(new Date(response.dt * 1000), 'dd.MM.yyyy HH:mm');
                                content = close_button + '<div style="width:300px"><p><b>' + response.name + '</b><br/><small> at ' + date_row + '</small></p>' + cloud + '<br/>' + temp_row + '<br/>' + wind_row + '<br/>' + to_trip_button + " " + new_point_button + "</div>";
                            }
                            angular.element(element).popover({
                                'placement': 'top',
                                'animation': false,
                                'html': true,
                                'content': content
                            });

                            popup.setPosition(coordinate);
                            angular.element(element).popover('show');
                            angular.element('.close', element.nextElementSibling).click(function() {
                                angular.element(element).popover('hide');
                                //show_location_weather = false;
                            });
                            createLayerSelectorForNewPoi(popup, coordinate);
                            angular.element('.hs-spoi-point-to-trip', element.nextElementSibling).click(function() {
                                trip_planner_service.addWaypoint(lon_lat[0], lon_lat[1]);
                                return false;
                            })

                        });

                });

                function createLayerSelectorForNewPoi(popup, coordinate) {
                    var possible_layers = [];
                    angular.element("#hs-spoi-new-layer-list").html('');
                    angular.forEach(config.box_layers[1].getLayers(), function(layer) {
                        if (layer.getVisible()) {
                            possible_layers.push(layer);
                            var $li = $('<li><a href="#">' + layer.get('title') + '</a></li>');
                            $li.data('layer', layer);

                            function layerSelected() {
                                var layer = $(this).data('layer');
                                spoi_editor.addPoi(layer);
                                popup.setPosition(undefined);
                                $scope.$broadcast('infopanel.feature_select', feature);
                                return false;
                            }

                            $li.click(layerSelected);
                            angular.element("#hs-spoi-new-layer-list").append($li);
                        }
                    });
                    $(".dropdown-toggle").dropdown();
                }

                $scope.$on('feature_crossfilter_filtered', function(event, data) {
                    var lyr = OlMap.findLayerByTitle('Specific points of interest');
                    var src = lyr.getSource();
                    src.clear();
                    if (data !== '') {
                        src.options.geom_attribute = '?geom';
                        src.options.url = 'http://data.plan4all.eu/sparql?default-graph-uri=&query=' + encodeURIComponent('SELECT ?o ?p ?s FROM <http://www.sdi4apps.eu/poi.rdf> WHERE { ?o <http://www.openvoc.eu/poi#categoryWaze> ?filter_categ. ?o <http://www.opengis.net/ont/geosparql#asWKT> ?geom. FILTER(isBlank(?geom) = false). FILTER (str(?filter_categ) = "' + data + '"). ') + '<extent>' + encodeURIComponent('	?o ?p ?s } ORDER BY ?o') + '&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on';
                    } else
                        src.options.url = '';
                });

                var hr_mappings;
                $http({
                    method: 'GET',
                    url: 'data.json',
                    cache: false
                }).then(function successCallback(response) {
                    hr_mappings = response.data;
                    spoi_editor.init(hr_mappings);
                    angular.forEach(hr_mappings["http://www.openvoc.eu/poi#categoryWaze"], function(name, category) {
                        var new_lyr = new ol.layer.Vector({
                            title: " " + name,
                            source: new SparqlJson({
                                geom_attribute: '?geom',
                                url: 'http://data.plan4all.eu/sparql?default-graph-uri=&query=' + encodeURIComponent('SELECT ?o ?p ?s FROM <http://www.sdi4apps.eu/poi.rdf> FROM <http://www.sdi4apps.eu/poi_changes.rdf> WHERE { ?o <http://www.openvoc.eu/poi#categoryWaze> <' + category + '>. ?o <http://www.opengis.net/ont/geosparql#asWKT> ?geom. FILTER(isBlank(?geom) = false). ') + '<extent>' + encodeURIComponent('	?o ?p ?s } ORDER BY ?o') + '&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on',
                                updates_url: 'http://data.plan4all.eu/sparql?default-graph-uri=&query=' + encodeURIComponent('SELECT ?o ?date ?attr ?value FROM <http://www.sdi4apps.eu/poi.rdf> FROM <http://www.sdi4apps.eu/poi_changes.rdf> WHERE { ?o <http://www.openvoc.eu/poi#categoryWaze> <' + category + '>. ?o <http://www.opengis.net/ont/geosparql#asWKT> ?geom. FILTER(isBlank(?geom) = false). ') + '<extent>' + encodeURIComponent(' ?o <http://purl.org/dc/elements/1.1/identifier> ?id. ?c <http://www.sdi4apps.eu/poi_changes/poi_id> ?id. ?c <http://purl.org/dc/terms/1.1/created> ?date. ?c <http://www.sdi4apps.eu/poi_changes/attribute_set> ?attr_set. ?attr_set ?attr ?value } ORDER BY ?o ?date ?attr ?value') + '&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on',
                                category_field: 'http://www.openvoc.eu/poi#categoryWaze',
                                projection: 'EPSG:3857'
                                    //feature_loaded: function(feature){feature.set('hstemplate', 'hs.geosparql_directive')}
                            }),
                            style: style,
                            visible: false,
                            path: 'Points of interest',
                            category: category
                                //minResolution: 1,
                                //maxResolution: 38
                        });
                        config.box_layers[1].getLayers().insertAt(0, new_lyr);
                    })
                    angular.forEach(hr_mappings.popular_categories, function(name, category) {
                        var new_lyr = new ol.layer.Vector({
                            title: " " + name,
                            source: new SparqlJson({
                                geom_attribute: '?geom',
                                url: 'http://data.plan4all.eu/sparql?default-graph-uri=&query=' + encodeURIComponent('SELECT ?o ?p ?s FROM <http://www.sdi4apps.eu/poi.rdf> FROM <http://www.sdi4apps.eu/poi_changes.rdf> WHERE { ?o <http://www.openvoc.eu/poi#categoryOSM> ?filter_categ. ?o <http://www.opengis.net/ont/geosparql#asWKT> ?geom. FILTER(isBlank(?geom) = false). FILTER (str(?filter_categ) = "' + category + '"). ') + '<extent>' + encodeURIComponent('	?o ?p ?s } ORDER BY ?o') + '&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on',
                                updates_url: 'http://data.plan4all.eu/sparql?default-graph-uri=&query=' + encodeURIComponent('SELECT ?o ?date ?attr ?value FROM <http://www.sdi4apps.eu/poi.rdf> FROM <http://www.sdi4apps.eu/poi_changes.rdf> WHERE { ?o <http://www.openvoc.eu/poi#categoryOSM> ?filter_categ. ?o <http://www.opengis.net/ont/geosparql#asWKT> ?geom. FILTER(isBlank(?geom) = false). FILTER (str(?filter_categ) = "' + category + '"). ') + '<extent>' + encodeURIComponent(' ?o <http://purl.org/dc/elements/1.1/identifier> ?id. ?c <http://www.sdi4apps.eu/poi_changes/poi_id> ?id. ?c <http://purl.org/dc/terms/1.1/created> ?date. ?c <http://www.sdi4apps.eu/poi_changes/attribute_set> ?attr_set. ?attr_set ?attr ?value } ORDER BY ?o ?date ?attr ?value') + '&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on',
                                category_field: 'http://www.openvoc.eu/poi#categoryOSM',
                                projection: 'EPSG:3857'
                            }),
                            style: styleOSM,
                            visible: false,
                            path: 'Popular Categories',
                            minResolution: 1,
                            maxResolution: 38,
                            category: category
                        });
                        config.box_layers[1].getLayers().insertAt(0, new_lyr);
                    })
                    OlMap.reset();
                })

                $scope.getSpoiCategories = spoi_editor.getSpoiCategories;
                $scope.makeHumanReadable = spoi_editor.makeHumanReadable;
                $scope.attrToEnglish = spoi_editor.attrToEnglish;
                $scope.startEdit = spoi_editor.startEdit;
                $scope.attributesHaveChanged = spoi_editor.attributesHaveChanged;
                $scope.editDropdownVisible = spoi_editor.editDropdownVisible;
                $scope.editTextboxVisible = spoi_editor.editTextboxVisible;
                $scope.saveSpoiChanges = spoi_editor.saveSpoiChanges;
            }
        ]).filter('usrFrSpoiAttribs', ['spoi_editor', function(spoi_editor) {
            return spoi_editor.filterAttribs;
        }]);

        return module;
    });
