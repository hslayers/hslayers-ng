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
        
        module.directive('hs.advancedInfopanelDirective', function() {
            return {
                templateUrl: 'advanced_info.html?bust=' + gitsha,
                link: function(scope, element, attrs) {
                    $('#advanced-info-dialog').modal('show');
                }
            };
        });

        var style = function(feature, resolution) {
            if (typeof feature.get('visible') === 'undefined' || feature.get('visible') == true) {
                var s = feature.get('http://www.sdi4apps.eu/poi/#mainCategory');

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
                var s = feature.get('http://www.sdi4apps.eu/poi/#mainCategory');
                if (typeof s === 'undefined') return;
                s = s.split("#")[1];
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
                title: 'Touristic',
                layers: []}),
            new ol.layer.Group({
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

        module.controller('Main', ['$scope', '$compile', '$filter', 'Core', 'hs.map.service', '$sce', '$http', 'config', 'hs.trip_planner.service', 'hs.permalink.service_url', 'hs.utils.service', 'spoi_editor', 'hs.query.service_infopanel',
            function($scope, $compile, $filter, Core, OlMap, $sce, $http, config, trip_planner_service, permalink, utils, spoi_editor, infopanel_service) {
                if (console) console.log("Main called");
                $scope.hsl_path = hsl_path; //Get this from hslayers.js file
                $scope.Core = Core;

                Core.panelEnabled('compositions', false);
                Core.panelEnabled('ows', false);
                $scope.InfoPanelService = infopanel_service;


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
                        url = "http://api.openweathermap.org/data/2.5/weather?APPID=13b627424cd072290defed4216e92baa&lat=" + lon_lat[1] + "&lon=" + lon_lat[0];
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
                                content = '{0}<div style="width:300px"><p><b>{1}&nbsp;<span id="hs-spoi-country-placeholder">{2}</span></b><br/><small> at {3}</small></p>{4}<br/>{5}<br/>{6}<br/>{7} {8}</div>'
                                    .format(close_button, response.name, $scope.country_last_clicked.countryName, date_row, cloud, temp_row, wind_row, to_trip_button, new_point_button);
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
                    getCountryAtCoordinate(coordinate);
                });

                function getCountryAtCoordinate(coordinate) {
                    var latlng = ol.proj.transform(coordinate, OlMap.map.getView().getProjection(), 'EPSG:4326');
                    delete $scope.country_last_clicked;
                    $http.get('http://api.geonames.org/extendedFindNearby?lat={0}&lng={1}&username=raitis'.format(latlng[1], latlng[0]))
                        .then(function(response) {
                            var country_geoname = angular.element('fcl', response.data).filter(function(index) {
                                return angular.element(this).text() === "A";
                            }).parent();
                            $scope.country_last_clicked = {
                                geonameId: country_geoname.find('geonameId').html(),
                                countryName: country_geoname.find('countryName').html(),
                                countryCode: country_geoname.find('countryCode').html()
                            };
                            angular.element('#hs-spoi-country-placeholder').html($scope.country_last_clicked.country);
                        });
                }
                
                function layerSelected() {
                    var layer = $(this).data('layer');
                    var feature = spoi_editor.addPoi(layer, $(this).data('coordinate'), $scope.country_last_clicked, $(this).data('sub_category'));
                    popup.setPosition(undefined);
                    $scope.$broadcast('infopanel.feature_select', feature);
                    return false;
                }

                function createLayerSelectorForNewPoi(popup, coordinate) {
                    var possible_layers = [];
                    angular.element("#hs-spoi-new-layer-list").html('');
                    angular.forEach(config.box_layers[1].getLayers(), function(layer) {
                        if (layer.getVisible()) {
                            possible_layers.push(layer);
                            var $li = $('<li><a href="#">' + layer.get('title') + '</a></li>');
                            var category = layer.get('category');
                            if (angular.isDefined(spoi_editor.getCategoryHierarchy()[category])){
                                //Was main category
                                $li.addClass('dropdown-submenu');
                                var $ul = $('<ul></ul>');
                                $ul.addClass('dropdown-menu');
                                $li.append($ul);
                                $li.click(function(){
                                    $('.dropdown-submenu .dropdown-menu').hide();
                                    $ul.show();
                                })
                                angular.forEach(spoi_editor.getCategoryHierarchy()[category], function(sub_category_label, sub_category) {
                                    var $li_subcategory = $('<li><a href="#">' + sub_category_label.capitalizeFirstLetter() + '</a></li>');
                                    $li_subcategory.data('layer', layer);
                                    $li_subcategory.data('sub_category', sub_category);
                                    $li_subcategory.data('coordinate', coordinate);
                                    $li_subcategory.click(layerSelected);
                                    $ul.append($li_subcategory);
                                })
                            } else {
                                //Was Popular category
                                $li.data('layer', layer);
                                $li.data('sub_category', category);
                                $li.data('coordinate', coordinate);
                                $li.click(layerSelected);
                            }
                            
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

                spoi_editor.init();
                var hr_mappings;
                var list_loaded = {dynamic_categories: false, static_categories: false};
                function checkListLoaded(){
                    if(list_loaded.dynamic_categories && list_loaded.static_categories){
                        if(console) console.info('Load spoi layers');
                        OlMap.reset();
                    }
                }
                 var q = encodeURIComponent('SELECT DISTINCT ?main ?label ?subs ?sublabel FROM <http://www.sdi4apps.eu/poi_categories.rdf> WHERE {?subs <http://www.w3.org/2000/01/rdf-schema#subClassOf> ?main. ?main <http://www.w3.org/2000/01/rdf-schema#label> ?label. ?subs <http://www.w3.org/2000/01/rdf-schema#label> ?sublabel} ORDER BY ?main ');  

                 $http({
                    method: 'GET',
                    url: 'http://data.plan4all.eu/sparql?default-graph-uri=&query=' + q + '&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on',
                    cache: false
                }).then(function successCallback(response) {
                    var last_main_category = '';
                    angular.forEach(response.data.results.bindings, function(x){
                        var category = x.main.value;
                        spoi_editor.registerCategory(x.main.value, x.label.value, x.subs.value, x.sublabel.value);
                        if (category != last_main_category){
                            last_main_category = category;
                            var name = x.label.value.capitalizeFirstLetter();
                            var new_lyr = new ol.layer.Vector({
                                title: " " + name,
                                source: new SparqlJson({
                                    geom_attribute: '?geom',
                                    url: 'http://data.plan4all.eu/sparql?default-graph-uri=&query=' + encodeURIComponent('SELECT ?o ?p ?s FROM <http://www.sdi4apps.eu/poi.rdf> FROM <http://www.sdi4apps.eu/poi_changes.rdf> FROM <http://www.sdi4apps.eu/poi_categories.rdf> WHERE { ?o <http://www.openvoc.eu/poi#class> ?sub. ?sub <http://www.w3.org/2000/01/rdf-schema#subClassOf> <' + category + '>. ?o <http://www.opengis.net/ont/geosparql#asWKT> ?geom. FILTER(isBlank(?geom) = false). ') + '<extent>' + encodeURIComponent('	?o ?p ?s } ORDER BY ?o') + '&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on',
                                    updates_url: 'http://data.plan4all.eu/sparql?default-graph-uri=&query=' + encodeURIComponent('SELECT ?o ?date ?attr ?value FROM <http://www.sdi4apps.eu/poi.rdf> FROM <http://www.sdi4apps.eu/poi_categories.rdf> FROM <http://www.sdi4apps.eu/poi_changes.rdf> WHERE { ?o <http://www.openvoc.eu/poi#class> ?sub. ?sub <http://www.w3.org/2000/01/rdf-schema#subClassOf> <' + category + '>. ?o <http://www.opengis.net/ont/geosparql#asWKT> ?geom. FILTER(isBlank(?geom) = false). ') + '<extent>' + encodeURIComponent(' ?o <http://purl.org/dc/elements/1.1/identifier> ?id. ?c <http://www.sdi4apps.eu/poi_changes/poi_id> ?id. ?c <http://purl.org/dc/terms/1.1/created> ?date. ?c <http://www.sdi4apps.eu/poi_changes/attribute_set> ?attr_set. ?attr_set ?attr ?value } ORDER BY ?o ?date ?attr ?value') + '&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on',
                                    category_field: 'http://www.openvoc.eu/poi#class',
                                    category: category,
                                    projection: 'EPSG:3857',
                                    extend_with_attribs: spoi_editor.getFriendlyAttribs()
                                        //feature_loaded: function(feature){feature.set('hstemplate', 'hs.geosparql_directive')}
                                }),
                                style: style,
                                visible: false,
                                path: 'Points of interest',
                                category: category,
                                minResolution: 1,
                                maxResolution: 38
                            });
                            config.box_layers[1].getLayers().insertAt(0, new_lyr);
                        }
                    });
                    list_loaded.dynamic_categories = true;
                    checkListLoaded();
                })
                
                
                $http({
                    method: 'GET',
                    url: 'data.json',
                    cache: false
                }).then(function successCallback(response) {
                    var hr_mappings = response.data;
                    spoi_editor.extendMappings(hr_mappings);
                    angular.forEach(hr_mappings.popular_categories, function(name, category) {
                        spoi_editor.registerCategory(null, null, category, name);
                        var new_lyr = new ol.layer.Vector({
                            title: " " + name,
                            source: new SparqlJson({
                                geom_attribute: '?geom',
                                url: 'http://data.plan4all.eu/sparql?default-graph-uri=&query=' + encodeURIComponent('SELECT ?o ?p ?s FROM <http://www.sdi4apps.eu/poi.rdf> FROM <http://www.sdi4apps.eu/poi_changes.rdf> FROM <http://www.sdi4apps.eu/poi_categories.rdf> WHERE { ?o <http://www.openvoc.eu/poi#class>  <' + category + '>. ?o <http://www.opengis.net/ont/geosparql#asWKT> ?geom. FILTER(isBlank(?geom) = false). ') + '<extent>' + encodeURIComponent('?o ?p ?s } ORDER BY ?o') + '&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on',
                                updates_url: 'http://data.plan4all.eu/sparql?default-graph-uri=&query=' + encodeURIComponent('SELECT ?o ?date ?attr ?value FROM <http://www.sdi4apps.eu/poi.rdf> FROM <http://www.sdi4apps.eu/poi_categories.rdf> FROM <http://www.sdi4apps.eu/poi_changes.rdf> WHERE { ?o <http://www.openvoc.eu/poi#class> <' + category + '>. ?o <http://www.opengis.net/ont/geosparql#asWKT> ?geom. FILTER(isBlank(?geom) = false).') + '<extent>' + encodeURIComponent(' ?o <http://purl.org/dc/elements/1.1/identifier> ?id. ?c <http://www.sdi4apps.eu/poi_changes/poi_id> ?id. ?c <http://purl.org/dc/terms/1.1/created> ?date. ?c <http://www.sdi4apps.eu/poi_changes/attribute_set> ?attr_set. ?attr_set ?attr ?value } ORDER BY ?o ?date ?attr ?value') + '&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on',
                                category_field: 'http://www.openvoc.eu/poi#class',
                                category: category,
                                projection: 'EPSG:3857',
                                extend_with_attribs: spoi_editor.getFriendlyAttribs()
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
                    list_loaded.static_categories = true;
                    checkListLoaded();
                })
                
                $scope.showDeveloperInfo = function(){
                    $("#hs-dialog-area #advanced-info-dialog").remove();
                    var el = angular.element('<div hs.advanced_infopanel_directive></div>');
                    $("#hs-dialog-area").append(el)
                    $compile(el)($scope);
                }

                $scope.getSpoiCategories = spoi_editor.getSpoiCategories;
                $scope.makeHumanReadable = spoi_editor.makeHumanReadable;
                $scope.attrToEnglish = spoi_editor.attrToEnglish;
                $scope.startEdit = spoi_editor.startEdit;
                $scope.attributesHaveChanged = spoi_editor.attributesHaveChanged;
                $scope.editDropdownVisible = spoi_editor.editDropdownVisible;
                $scope.editTextboxVisible = spoi_editor.editTextboxVisible;
                $scope.saveSpoiChanges = spoi_editor.saveSpoiChanges;
                $scope.editCategoryDropdownVisible = spoi_editor.editCategoryDropdownVisible;
                $scope.getSpoiDropdownItems = spoi_editor.getSpoiDropdownItems;

                $scope.$on('sidebar_change', function(event, expanded) {
                    infopanel_service.enabled = expanded;
                })
                
                function splitAddress(url){
                    return url.split('#')[1];
                }
                
                $scope.splitAddress = splitAddress;

            }
        ]).filter('usrFrSpoiAttribs', ['spoi_editor', function(spoi_editor) {
            return spoi_editor.filterAttribs;
        }]);

        return module;
    });
