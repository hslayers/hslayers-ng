'use strict';

define(['angular', 'ol', 'toolbar', 'layermanager', 'SparqlJson', 'sidebar', 'map', 'ows', 'query', 'search', 'permalink', 'measure', 'legend', 'bootstrap', 'geolocation', 'core', 'datasource_selector', 'api', 'angular-gettext', 'translations', 'compositions', 'status_creator', 'info', 'trip_planner', 'spoi_editor', 'upload'],

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
             'hs.trip_planner',
            'spoi_editor',
            'hs.upload'
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

        
        module.directive('hs.pointPopupDirective', function() {
            return {
                templateUrl: 'pointpopup.html?bust=' + gitsha,
                link: function(scope, element, attrs) {
                    var container = document.getElementById('popup');
                    scope.popup = new ol.Overlay({
                        element: container,
                        autoPan: true,
                        autoPanAnimation: {
                            duration: 250
                        }
                    });
                    scope.addPopupToMap();
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
                            src: 'symbolsWaze/' + s + '.png',
                            size: [30, 35],
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
                            src: 'symbols/' + s + '.png',
                            size: [30, 35],
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
        
        var base_layer_group = new ol.layer.Group({
            'img': 'osm.png',
            title: 'Base layer',
            layers: [
                new ol.layer.Tile({
                    source: new ol.source.OSM(),
                    title: "OpenStreetMap",
                    base: true,
                    visible: true,
                    path: 'Roads'
                }),
                new ol.layer.Tile({
                    title: "OpenCycleMap",
                    visible: false,
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
        });
        
        var tourist_layer_group = new ol.layer.Group({
            title: 'Touristic',
            'img': 'POIs.png',
            layers: []
        });
        
        var weather_layer_group = new ol.layer.Group({
            'img': 'partly_cloudy.png',
            title: 'Weather',
            layers: [new ol.layer.Tile({
                    title: "OpenWeatherMap cloud cover",
                    source: new ol.source.XYZ({
                        url: "http://{a-c}.tile.openweathermap.org/map/clouds/{z}/{x}/{y}.png?appid=13b627424cd072290defed4216e92baa"
                    }),
                    visible: false,
                    opacity: 0.7,
                    path: 'Weather info'
                }),
                new ol.layer.Tile({
                    title: "OpenWeatherMap precipitation",
                    source: new ol.source.XYZ({
                        url: "http://{a-c}.tile.openweathermap.org/map/precipitation/{z}/{x}/{y}.png?appid=13b627424cd072290defed4216e92baa"
                    }),
                    visible: false,
                    opacity: 0.7,
                    path: 'Weather info'
                }),
                new ol.layer.Tile({
                    title: "OpenWeatherMap temperature",
                    source: new ol.source.XYZ({
                        url: "http://{a-c}.tile.openweathermap.org/map/temp/{z}/{x}/{y}.png?appid=13b627424cd072290defed4216e92baa"
                    }),
                    visible: false,
                    opacity: 0.7,
                    path: 'Weather info'
                })
            ]
        })

        var geoJsonFormat = new ol.format.GeoJSON;
        module.value('config', {
            search_provider: ['sdi4apps_openapi', 'geonames'],
            box_layers: [base_layer_group, tourist_layer_group, weather_layer_group],
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

        module.controller('Main', ['$scope', '$compile', '$filter', 'Core', 'hs.map.service', '$sce', '$http', 'config', 'hs.trip_planner.service', 'hs.permalink.service_url', 'hs.utils.service', 'spoi_editor', 'hs.query.baseService',
            function($scope, $compile, $filter, Core, OlMap, $sce, $http, config, trip_planner_service, permalink, utils, spoi_editor, queryService) {
                if (console) console.log("Main called");
                $scope.hsl_path = hsl_path; //Get this from hslayers.js file
                $scope.Core = Core;

                Core.panelEnabled('compositions', false);
                Core.panelEnabled('ows', false);
                Core.panelEnabled('status_creator', false);
                $scope.queryData = queryService.data;

                $scope.$on("scope_loaded", function(event, args, arg2) {
                    if (args == 'Sidebar') {
                        var el = angular.element('<div hs.trip_planner.directive hs.draggable ng-controller="hs.trip_planner.controller" ng-if="Core.exists(\'hs.trip_planner.controller\')" ng-show="Core.panelVisible(\'trip_planner\', this)"></div>');
                        angular.element('#panelplace').append(el);
                        $compile(el)($scope);

                        var toolbar_button = angular.element('<div hs.trip_planner.toolbar_button_directive></div>');
                        angular.element('.sidebar-list').append(toolbar_button);
                        $compile(toolbar_button)(event.targetScope);
                    }
                })

                $scope.$on('infopanel.updated', function(event) {});

                var el = angular.element('<div hs.point_popup_directive></div>');
                $("#hs-dialog-area").append(el)
                $compile(el)($scope);
                
                //Which ever comes first - map.laoded event or popup directives link function - add the overlay.
                function addPopupToMap(){
                    if(angular.isDefined($scope.popup) && angular.isUndefined($scope.popup.added)) {
                        OlMap.map.addOverlay($scope.popup);
                        $scope.popup.added = true;
                    }
                }
                
                $scope.addPopupToMap = addPopupToMap;
                
                $scope.$on('map.loaded', $scope.addPopupToMap);

                var show_location_weather = true;
                $scope.$on('queryClicked', function(event, data) {
                    if (!show_location_weather) return;
                    var on_features = false;
                    angular.forEach(data.frameState.skippedFeatureUids, function(k) {
                        on_features = true;
                    });
                    if (on_features) return;
                    getWeatherInfo(data.coordinate);
                    getCountryAtCoordinate(data.coordinate);
                    console.log(OlMap.map.getView().getResolution());
                });
                
                function getWeatherInfo(coordinate){
                    var lon_lat = ol.proj.transform(coordinate, 'EPSG:3857', 'EPSG:4326');
                    $scope.lon_lat = lon_lat;
                    var url = utils.proxify("http://api.openweathermap.org/data/2.5/weather?APPID=13b627424cd072290defed4216e92baa&lat=" + lon_lat[1] + "&lon=" + lon_lat[0]);
                    $http({
                        method: 'GET',
                        url: url,
                        cache: false
                    }).then(function successCallback(response) {
                        $scope.popup.setPosition(coordinate);
                        createLayerSelectorForNewPoi(coordinate);
                        if (response.data.weather) {
                            $scope.weather_info = response.data;
                            $scope.weather_info.date_row =  $filter('date')(new Date(response.data.dt * 1000), 'dd.MM.yyyy HH:mm');
                            $scope.weather_info.temp_row = (response.data.main.temp - 273.15).toFixed(1);
                        } else {
                            $scope.weather_info = null;
                        }
                    });   
                }
        
                $scope.hidePopup = function(){
                    $scope.popup.setPosition(undefined);
                    return false;
                }
                
                $scope.addToTrip = function(){
                    trip_planner_service.addWaypoint($scope.lon_lat[0], $scope.lon_lat[1]);
                    Core.setMainPanel('trip_planner');
                    return false;
                }

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
                    $scope.popup.setPosition(undefined);
                    $scope.$broadcast('infopanel.feature_select', feature);
                    return false;
                }
                
                $scope.$on('infopanel.feature_selected', function(event, feature) {
                    $scope.lon_lat = ol.proj.transform(feature.getGeometry().flatCoordinates, 'EPSG:3857', 'EPSG:4326');
                    spoi_editor.id = feature.get('http://purl.org/dc/elements/1.1/identifier');
                    Core.setMainPanel("info", false);
                });

                function createLayerSelectorForNewPoi(coordinate) {
                    var possible_layers = [];
                    angular.element("#hs-spoi-new-layer-list").html('');
                    angular.forEach(tourist_layer_group.getLayers(), function(layer) {
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
                                if($('.hs-spoi-new-poi').offset().left+331 > $('div[hs]').width()-$('.panelspace').width()){
                                    $ul.addClass('to_left');
                                }
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

                /* Not really used anymore
                $scope.$on('feature_crossfilter_filtered', function(event, data) {
                    var lyr = OlMap.findLayerByTitle('Specific points of interest');
                    var src = lyr.getSource();
                    src.clear();
                    if (data !== '') {
                        src.options.geom_attribute = '?geom';
                        src.options.url = 'http://data.plan4all.eu/sparql?default-graph-uri=&query=' + encodeURIComponent('SELECT ?o ?p ?s FROM <http://www.sdi4apps.eu/poi.rdf> WHERE { ?o <http://www.openvoc.eu/poi#categoryWaze> ?filter_categ. ?o <http://www.opengis.net/ont/geosparql#asWKT> ?geom. FILTER(isBlank(?geom) = false). FILTER (str(?filter_categ) = "' + data + '"). ') + '<extent>' + encodeURIComponent('	?o ?p ?s } ORDER BY ?o') + '&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on';
                    } else
                        src.options.url = '';
                });*/

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
                                    url: 'http://data.plan4all.eu/sparql_spoi?default-graph-uri=&query=' + encodeURIComponent('SELECT ?o ?p ?s FROM <http://www.sdi4apps.eu/poi.rdf> FROM <http://www.sdi4apps.eu/poi_changes.rdf> FROM <http://www.sdi4apps.eu/poi_categories.rdf> WHERE { ?o <http://www.openvoc.eu/poi#class> ?sub. ?sub <http://www.w3.org/2000/01/rdf-schema#subClassOf> <' + category + '>. ?o <http://www.opengis.net/ont/geosparql#asWKT> ?geom. FILTER(isBlank(?geom) = false). ') + '<extent>' + encodeURIComponent('	?o ?p ?s } ORDER BY ?o') + '&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on',
                                    updates_url: 'http://data.plan4all.eu/sparql_spoi?default-graph-uri=&query=' + encodeURIComponent('SELECT ?o ?date ?attr ?value FROM <http://www.sdi4apps.eu/poi.rdf> FROM <http://www.sdi4apps.eu/poi_categories.rdf> FROM <http://www.sdi4apps.eu/poi_changes.rdf> WHERE { ?o <http://www.openvoc.eu/poi#class> ?sub. ?sub <http://www.w3.org/2000/01/rdf-schema#subClassOf> <' + category + '>. ?o <http://www.opengis.net/ont/geosparql#asWKT> ?geom. FILTER(isBlank(?geom) = false). ') + '<extent>' + encodeURIComponent(' ?o <http://purl.org/dc/elements/1.1/identifier> ?id. ?c <http://www.sdi4apps.eu/poi_changes/poi_id> ?id. ?c <http://purl.org/dc/terms/1.1/created> ?date. ?c <http://www.sdi4apps.eu/poi_changes/attribute_set> ?attr_set. ?attr_set ?attr ?value } ORDER BY ?o ?date ?attr ?value') + '&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on',
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
                                maxResolution: getMaxResolution(category)
                            });
                            tourist_layer_group.getLayers().insertAt(0, new_lyr);
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
                                url: 'http://data.plan4all.eu/sparql_spoi?default-graph-uri=&query=' + encodeURIComponent('SELECT ?o ?p ?s FROM <http://www.sdi4apps.eu/poi.rdf> FROM <http://www.sdi4apps.eu/poi_changes.rdf> FROM <http://www.sdi4apps.eu/poi_categories.rdf> WHERE { ?o <http://www.openvoc.eu/poi#class>  <' + category + '>. ?o <http://www.opengis.net/ont/geosparql#asWKT> ?geom. FILTER(isBlank(?geom) = false). ') + '<extent>' + encodeURIComponent('?o ?p ?s } ORDER BY ?o') + '&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on',
                                updates_url: 'http://data.plan4all.eu/sparql_spoi?default-graph-uri=&query=' + encodeURIComponent('SELECT ?o ?date ?attr ?value FROM <http://www.sdi4apps.eu/poi.rdf> FROM <http://www.sdi4apps.eu/poi_categories.rdf> FROM <http://www.sdi4apps.eu/poi_changes.rdf> WHERE { ?o <http://www.openvoc.eu/poi#class> <' + category + '>. ?o <http://www.opengis.net/ont/geosparql#asWKT> ?geom. FILTER(isBlank(?geom) = false).') + '<extent>' + encodeURIComponent(' ?o <http://purl.org/dc/elements/1.1/identifier> ?id. ?c <http://www.sdi4apps.eu/poi_changes/poi_id> ?id. ?c <http://purl.org/dc/terms/1.1/created> ?date. ?c <http://www.sdi4apps.eu/poi_changes/attribute_set> ?attr_set. ?attr_set ?attr ?value } ORDER BY ?o ?date ?attr ?value') + '&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on',
                                category_field: 'http://www.openvoc.eu/poi#class',
                                category: category,
                                projection: 'EPSG:3857',
                                extend_with_attribs: spoi_editor.getFriendlyAttribs()
                            }),
                            style: styleOSM,
                            visible: false,
                            path: 'Popular Categories',
                            maxResolution: getMaxResolution(category),
                            category: category
                        });
                        tourist_layer_group.getLayers().insertAt(0, new_lyr);
                    })
                    list_loaded.static_categories = true;
                    checkListLoaded();
                })
                
                function getMaxResolution(category){
                    var default_res = 38;
                    //console.log(category);
                    if(category == 'http://gis.zcu.cz/SPOI/Ontology#transportation')
                        default_res = 4;
                    if(category == 'http://gis.zcu.cz/SPOI/Ontology#other')
                        default_res = 19;
                    if(category == 'http://gis.zcu.cz/SPOI/Ontology#outdoor')
                        default_res = 160;
                    if(category == 'http://gis.zcu.cz/SPOI/Ontology#car_service')
                        default_res = 20;
                    if(category == 'http://gis.zcu.cz/SPOI/Ontology#natural_feature')
                        default_res = 160;
                    if(category == 'http://gis.zcu.cz/SPOI/Ontology#camp_site')
                        default_res = 310;
                    if(category == 'http://gis.zcu.cz/SPOI/Ontology#lodging')
                        default_res = 160;
                    if(category == 'http://gis.zcu.cz/SPOI/Ontology#information')
                        default_res = 160;
                    
                    return default_res;
                }
                
                $scope.showDeveloperInfo = function(){
                    $("#hs-dialog-area #advanced-info-dialog").remove();
                    var el = angular.element('<div hs.advanced_infopanel_directive></div>');
                    $("#hs-dialog-area").append(el)
                    $compile(el)($scope);
                }
                
                $scope.attributeEditorMode = function(attribute){
                    if($scope.editTextboxVisible(attribute)) return 1;
                    else if($sce.valueOf(attribute.value).indexOf('http')==-1)  return 2;
                    else if($sce.valueOf(attribute.value).indexOf('http')>-1)  return 3;
                }
                
                $scope.toggleUploadPhoto = function(){
                    $scope.upload_visible = !$scope.upload_visible;
                }

                $scope.getSpoiCategories = spoi_editor.getSpoiCategories;
                $scope.makeHumanReadable = spoi_editor.makeHumanReadable;
                $scope.attrToEnglish = spoi_editor.attrToEnglish;
                $scope.startEdit = spoi_editor.startEdit;
                $scope.attributesHaveChanged = spoi_editor.attributesHaveChanged;
                $scope.editDropdownVisible = spoi_editor.editDropdownVisible;
                $scope.editTextboxVisible = spoi_editor.editTextboxVisible;
                $scope.saveSpoiChanges = spoi_editor.saveSpoiChanges;
                $scope.cancelSpoiChanges = spoi_editor.cancelSpoiChanges;
                $scope.editCategoryDropdownVisible = spoi_editor.editCategoryDropdownVisible;
                $scope.getSpoiDropdownItems = spoi_editor.getSpoiDropdownItems;
                $scope.getNotEditableAttrs = spoi_editor.getNotEditableAttrs;
                
                $scope.$on('sidebar_change', function(event, expanded) {
                    queryService.enabled = expanded;
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
