'use strict';

define(['ol', 'dc', 'toolbar', 'layermanager', 'SparqlJson', 'sidebar', 'query', 'search', 'permalink', 'measure', 'geolocation', 'bootstrap', 'panoramio', 'bootstrap', 'api', 'styles'],

    function(ol, dc, toolbar, layermanager, SparqlJson) {
        var module = angular.module('hs', [
            'hs.toolbar',
            'hs.layermanager',
            'hs.query',
            'hs.search', 'hs.permalink',
            'hs.geolocation',
            'hs.api',
            /*'hs.feature_crossfilter', */
            'hs.panoramio',
            'hs.sidebar',
            'hs.styles'
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



        var sparql_layers = [];
        angular.forEach([
            'http://www.openvoc.eu/waze_classification#Car_services',
            'http://www.openvoc.eu/waze_classification#Transportation',
            'http://www.openvoc.eu/waze_classification#Professional_and_public',
            'http://www.openvoc.eu/waze_classification#Shopping_and_services',
            'http://www.openvoc.eu/waze_classification#Food_and_drink',
            'http://www.openvoc.eu/waze_classification#Culture_&_entertainment',
            'http://www.openvoc.eu/waze_classification#Other',
            'http://www.openvoc.eu/waze_classification#Lodging',
            'http://www.openvoc.eu/waze_classification#Outdoors',
            'http://www.openvoc.eu/waze_classification#Natural_features'
        ], function(value) {
            var value2;
            switch (value) {
                case 'http://www.openvoc.eu/waze_classification#Car_services':
                    value2 = "Car Services";
                    break;
                case 'http://www.openvoc.eu/waze_classification#Transportation':
                    value2 = "Transportation";
                    break;
                case 'http://www.openvoc.eu/waze_classification#Professional_and_public':
                    value2 = "Professional and Public";
                    break;
                case 'http://www.openvoc.eu/waze_classification#Shopping_and_services':
                    value2 = "Shopping and Services";
                    break;
                case 'http://www.openvoc.eu/waze_classification#Food_and_drink':
                    value2 = "Food and Drink";
                    break;
                case 'http://www.openvoc.eu/waze_classification#Culture_&_entertainment':
                    value2 = "Culture & Entertainment";
                    break;
                case 'http://www.openvoc.eu/waze_classification#Other':
                    value2 = "Other";
                    break;
                case 'http://www.openvoc.eu/waze_classification#Lodging':
                    value2 = "Lodging";
                    break;
                case 'http://www.openvoc.eu/waze_classification#Outdoors':
                    value2 = "Outdoors";
                    break;
                case 'http://www.openvoc.eu/waze_classification#Natural_features':
                    value2 = "Natural Features";
                    break;
            };
            var new_lyr = new ol.layer.Vector({
                title: " " + value2,
                source: new SparqlJson({
                    geom_attribute: '?geom',
                    url: 'http://data.plan4all.eu/sparql?default-graph-uri=&query=' + encodeURIComponent('SELECT ?o ?p ?s FROM <http://www.sdi4apps.eu/poi.rdf> WHERE { ?o <http://www.openvoc.eu/poi#categoryWaze> <' + value + '>. ?o <http://www.opengis.net/ont/geosparql#asWKT> ?geom. FILTER(isBlank(?geom) = false). ') + '<extent>' + encodeURIComponent('	?o ?p ?s } ORDER BY ?o') + '&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on',
                    category_field: 'http://www.openvoc.eu/poi#categoryWaze',
                    projection: 'EPSG:3857'
                        //feature_loaded: function(feature){feature.set('hstemplate', 'hs.geosparql_directive')}
                }),
                style: style,
                visible: false,
                path: 'Points of interest'
            });
            sparql_layers.push(new_lyr);
        })

        var sparql_osm_layers = [];
        angular.forEach([
            'amenity.atm',
            'amenity.bank',
            'amenity.cafe',
            'amenity.fast_food',
            'amenity.pub',
            'amenity.restaurant',
            'tourism.hotel',
            'shop.supermarket',
            'tourism.information'
        ], function(value) {
            var value2;
            switch (value) {
                case 'amenity.atm':
                    value2 = "ATM";
                    break;
                case 'amenity.bank':
                    value2 = "Bank";
                    break;
                case 'amenity.cafe':
                    value2 = "Cafe";
                    break;
                case 'amenity.fast_food':
                    value2 = "Fast Food";
                    break;
                case 'amenity.pub':
                    value2 = "Pub";
                    break;
                case 'amenity.restaurant':
                    value2 = "Restaurant";
                    break;
                case 'tourism.hotel':
                    value2 = "Hotel";
                    break;
                case 'shop.supermarket':
                    value2 = "Supermarket";
                    break;
                case 'tourism.information':
                    value2 = "Information";
                    break;
            };
            var new_lyr = new ol.layer.Vector({
                title: " " + value2,
                source: new SparqlJson({
                    geom_attribute: '?geom',
                    url: 'http://ng.hslayers.org:8890/sparql?default-graph-uri=&query=' + encodeURIComponent('SELECT ?o ?p ?s FROM <http://www.sdi4apps.eu/poi.rdf> WHERE { ?o <http://www.openvoc.eu/poi#categoryOSM> ?filter_categ. ?o <http://www.opengis.net/ont/geosparql#asWKT> ?geom. FILTER(isBlank(?geom) = false). FILTER (str(?filter_categ) = "' + value + '"). ') + '<extent>' + encodeURIComponent('	?o ?p ?s } ORDER BY ?o') + '&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on',
                    category_field: 'http://www.openvoc.eu/poi#categoryOSM',
                    projection: 'EPSG:3857'
                }),
                style: styleOSM,
                visible: false,
                path: 'Popular Categories'
            });
            sparql_osm_layers.push(new_lyr);
        })

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
                layers: sparql_layers.concat(sparql_osm_layers).concat([
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
                ])
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

        module.controller('Main', ['$scope', '$filter', 'Core', 'hs.map.service', 'hs.query.service_infopanel', '$sce',
            function($scope, $filter, Core, OlMap, InfoPanelService, $sce) {
                if (console) console.log("Main called");
                $scope.hsl_path = hsl_path; //Get this from hslayers.js file
                $scope.Core = Core;

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
                            $(element).popover('destroy');
                            var content = 'No weather info';
                            if (response.weather) {
                                var wind_row = 'Wind: ' + response.wind.speed + 'm/s' + (response.wind.gust ? ' Gust: ' + response.wind.gust + 'm/s' : '');
                                var close_button = '<button type="button" class="close"><span aria-hidden="true">×</span><span class="sr-only" translate>Close</span></button>';
                                var weather = response.weather[0];
                                var cloud = '<img src="http://openweathermap.org/img/w/' + weather.icon + '.png" alt="' + weather.description + '"/>' + weather.description;
                                var temp_row = 'Temperature: ' + (response.main.temp - 273.15).toFixed(1) + ' °C';
                                var date_row = $filter('date')(new Date(response.dt * 1000), 'dd.MM.yyyy HH:mm');
                                content = close_button + '<p><b>' + response.name + '</b><br/><small> at ' + date_row + '</small></p>' + cloud + '<br/>' + temp_row + '<br/>' + wind_row;
                            }
                            $(element).popover({
                                'placement': 'top',
                                'animation': false,
                                'html': true,
                                'content': content
                            });

                            popup.setPosition(coordinate);
                            $(element).popover('show');
                            $('.close', element.nextElementSibling).click(function() {
                                $(element).popover('hide');
                                //show_location_weather = false;
                            });
                        });

                });

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

                var osm_categ_hr_mapping = {
                    'aerialway.cable_car': 'Cable Car',
                    'highway.ford': 'Ford',
                    'aerialway.station': 'Station',
                    'highway.rest_area': 'Rest Area',
                    'aeroway.aerodrome': 'Aerodrome',
                    'highway.turning_circle': 'Turning Circle',
                    'aeroway.hangar': 'Hangar',
                    'historic.archaeological_site': 'Archaeological Site',
                    'aeroway.helipad': 'Helipad',
                    'historic.castle': 'Castle',
                    'aeroway.terminal': 'Terminal',
                    'historic.memorial': 'Memorial',
                    'amenity.arts_centre': 'Arts Centre',
                    'historic.meteor_crater': 'Meteor Crater',
                    'amenity.atm': 'ATM',
                    'historic.monument': 'Monument',
                    'amenity.attraction': 'Attraction',
                    'historic.ruins': 'Ruins',
                    'amenity.bank': 'Bank',
                    'historic.wayside_cross': 'Wayside Cross',
                    'amenity.bar': 'Bar',
                    'historic.wreck': 'Wreck',
                    'amenity.bbq': 'BBQ',
                    'landuse.basin': 'Basin',
                    'amenity.bicycle_parking': 'Bicycle Parking',
                    'landuse.farmland': 'Farmland',
                    'amenity.bicycle_rental': 'Bicycle Rental',
                    'landuse.farmyard': 'Farmyard',
                    'amenity.biergarten': 'Biergarten',
                    'landuse.reservoir': 'Reservoir',
                    'amenity.boat_rental': 'Boat Rental',
                    'leisure.common': 'Leisure - Common',
                    'amenity.bureau_de_change': 'Bureau de Change',
                    'leisure.garden': 'Garden',
                    'amenity.bus_station': 'Bus Station',
                    'leisure.golf_course': 'Golf Course',
                    'amenity.cafe': 'Cafe',
                    'leisure.horse_riding': 'Horse Riding',
                    'amenity.car_rental': 'Car Rental',
                    'leisure.hot_spring': 'Hot Spring',
                    'amenity.car_wash': 'Car Wash',
                    'leisure.ice_rink': 'Ice Rink',
                    'amenity.childcare': 'Childcare',
                    'leisure.marina': 'Marina',
                    'amenity.cinema': 'Cinema',
                    'leisure.nature_reserve': 'Nature Reserve',
                    'amenity.clinic': 'Clinic',
                    'leisure.park': 'Park',
                    'amenity.college': 'College',
                    'leisure.pitch': 'Pitch',
                    'amenity.community_centre': 'Community Centre',
                    'leisure.playground': 'Playground',
                    'amenity.courthouse': 'Courthouse',
                    'leisure.slipway': 'Slipway',
                    'amenity.dentist': 'Dentist',
                    'leisure.sports_centre': 'Sports Centre',
                    'amenity.dive_centre': 'Dive Centre',
                    'leisure.stadium': 'Stadium',
                    'amenity.doctors': 'Doctors',
                    'leisure.swimming_pool': 'Swimming Pool',
                    'amenity.drinking_water': 'Drinking Water',
                    'leisure.track': 'Track',
                    'amenity.embassy': 'Embassy',
                    'man_made.antenna': 'Antenna',
                    'amenity.fast_food': 'Fast Food',
                    'man_made.chimney': 'Chimney',
                    'amenity.ferry_terminal': 'Ferry Terminal',
                    'man_made.communications_tower': 'Communications Tower',
                    'amenity.fire_station': 'Fire Station',
                    'man_made.flagpole': 'Flagpole',
                    'amenity.food_court': 'Food Court',
                    'man_made.lighthouse': 'Lighthouse',
                    'amenity.fountain': 'Fountain',
                    'man_made.pier': 'Pier',
                    'amenity.fuel': 'Fuel',
                    'man_made.silo': 'Silo',
                    'amenity.gym': 'Gym',
                    'man_made.tower': 'Tower',
                    'amenity.hospital': 'Hospital',
                    'man_made.water_tank': 'Water Tank',
                    'amenity.ice_cream': 'Ice Cream',
                    'man_made.water_tower': 'Water Tower',
                    'amenity.kindergarten': 'kindergarten',
                    'man_made.water_well': 'Water Well',
                    'amenity.library': 'Library',
                    'man_made.windpump': 'Windpump',
                    'amenity.marketplace': 'Marketplace',
                    'military.attraction': 'Attraction',
                    'amenity.monastery': 'Monastery',
                    'natural.attraction': 'Attraction',
                    'amenity.money_transfer': 'Money Transfer',
                    'natural.bay': 'Bay',
                    'amenity.nightclub': 'Nightclub',
                    'natural.beach': 'Beach',
                    'amenity.parking': 'Parking',
                    'natural.cape': 'Cape',
                    'amenity.parking_entrance': 'Parking Entrance',
                    'natural.cave_entrance': 'Cave Entrance',
                    'amenity.parking_space': 'Parking Space',
                    'natural.cliff': 'Cliff',
                    'amenity.pharmacy': 'Pharmacy',
                    'natural.dune': 'Dune',
                    'amenity.place_of_worship': 'Place of Worship',
                    'natural.heath': 'Heath',
                    'amenity.police': 'Police',
                    'natural.hill': 'Hill',
                    'amenity.post_box': 'Post Box',
                    'natural.hills': 'Hills',
                    'amenity.post_office': 'Post Office',
                    'natural.massif': 'Massif',
                    'amenity.pub': 'Pub',
                    'natural.peak': 'Peak',
                    'amenity.public_building': 'Public Building',
                    'natural.peaks': 'Peaks',
                    'amenity.ranger_station': 'Ranger Station',
                    'natural.plateau': 'Plateau',
                    'amenity.rescue_station': 'Rescue Station',
                    'natural.protected_area': 'Protected Area',
                    'amenity.restaurant': 'Restaurant',
                    'natural.reef': 'Reef',
                    'amenity.restaurant,bar': 'Restaurant/Bar',
                    'natural.ridge': 'Ridge',
                    'amenity.school': 'School',
                    'natural.rock': 'Rock',
                    'amenity.shelter': 'Shelter',
                    'natural.rocks': 'Rock',
                    'amenity.shower': 'Shower',
                    'natural.sand': 'Sand',
                    'amenity.swimming_pool': 'Swimming Pool',
                    'natural.sand dune': 'Sand Dune',
                    'amenity.taxi': 'Taxi',
                    'natural.sandstone': 'Sandstone',
                    'amenity.telephone': 'Telephone',
                    'natural.spring': 'Spring',
                    'amenity.theatre': 'Theatre',
                    'natural.stone': 'Stone',
                    'amenity.toilets': 'Toilets',
                    'natural.tree': 'Tree',
                    'amenity.townhall': 'Townhall',
                    'natural.tree_row': 'Tree Row',
                    'amenity.university': 'University',
                    'natural.valley': 'Valley',
                    'amenity.vending_machine': 'Vending Machine',
                    'natural.water': 'Water',
                    'amenity.veterinary': 'Veterinary',
                    'natural.wetland': 'Wetland',
                    'amenity.visitor_centre': 'Visitor Centre',
                    'natural.wood': 'Wood',
                    'amenity.waste_basket': 'Waste Basket',
                    'place.city': 'City',
                    'amenity.water_point': 'Water Point',
                    'place.farm': 'Farm',
                    'boundary.national_park': 'National Park',
                    'place.hamlet': 'Hamlet',
                    'building.apartments': 'Apartments',
                    'place.island': 'Island',
                    'building.attraction': 'Attraction',
                    'place.islet': 'Islet',
                    'building.cathedral': 'Cathedral',
                    'place.isolated_dwelling': 'Isolated Dwelling',
                    'building.church': 'Church',
                    'place.locality': 'Locality',
                    'building.civic': 'Civic',
                    'place.mountain_range': 'Mountain Range',
                    'building.commercial': 'Commercial',
                    'place.neighbourhood': 'Neighbourhood',
                    'building.garage': 'Garage',
                    'place.region': 'Region',
                    'building.greenhouse': 'Greenhouse',
                    'place.suburb': 'Suburb',
                    'building.hospital': 'Hospital',
                    'place.town': 'Town',
                    'building.hotel': 'Hotel',
                    'place.village': 'Village',
                    'building.hut': 'Hostel',
                    'railway.crossing': 'Crossing',
                    'building.industrial': 'Industrial',
                    'railway.halt': 'Railway Halt',
                    'building.office': 'Office',
                    'railway.station': 'Railway Station',
                    'building.public': 'Public',
                    'religion.jewish': 'Jewish',
                    'building.residential': 'Residential',
                    'shop.alcohol': 'Alcohol',
                    'building.school': 'School',
                    'shop.art': 'Art',
                    'building.stadium': 'Stadium',
                    'shop.bakery': 'Bakery',
                    'building.terrace': 'Terrace',
                    'shop.beauty': 'Beauty',
                    'building.university': 'University',
                    'shop.beverages': 'Beverages',
                    'building.yes': 'Yes',
                    'shop.books': 'Books',
                    'highway.bus_stop': 'Bus Stop',
                    'shop.boutique': 'Boutique',
                    'highway.footway': 'Footway',
                    'shop.butcher': 'Butcher',
                    'shop.car': 'Car',
                    'shop.seafood': 'Seafood',
                    'shop.car_parts': 'Car Parts',
                    'shop.shoes': 'Shoes',
                    'shop.car_repair': 'Car Repair',
                    'shop.sports': 'Sports',
                    'shop.chemist': 'Chemist',
                    'shop.stationery': 'Stationery',
                    'shop.clothes': 'Clothes',
                    'shop.supermarket': 'Supermarket',
                    'shop.computer': 'Computer',
                    'shop.tailor': 'Tailor',
                    'shop.confectionery': 'Confectionery',
                    'shop.ticket': 'Ticket',
                    'shop.convenience': 'Convenience',
                    'shop.toys': 'Toys',
                    'shop.copyshop': 'Copyshop',
                    'shop.travel_agency': 'Travel Agency',
                    'shop.department_store': 'Department Store',
                    'shop.tyres': 'Tyres',
                    'shop.dive': 'Dive',
                    'shop.variety_store': 'Variety Store',
                    'shop.dive_centre': 'Dive Centre',
                    'shop.video': 'Video',
                    'shop.diving': 'Diving',
                    'shop.wholesale': 'Wholesale',
                    'shop.doityourself': 'DoItYourself',
                    'shop.wine': 'Wine',
                    'shop.dry_cleaning': 'Dry Cleaning',
                    'shop.yes': 'Yes',
                    'shop.electronics': 'Electronics',
                    'site_type.fortification': 'Fortification',
                    'shop.fashion': 'Fashion',
                    'sport.skiing': 'Skiing',
                    'shop.fishmonger': 'Fishmonger',
                    'tourism.alpine_hut': 'Alpine hut',
                    'shop.florist': 'Florist',
                    'tourism.apartment': 'Apartment',
                    'shop.garden_centre': 'Garden Centre',
                    'tourism.artwork': 'Artwork',
                    'shop.general': 'General',
                    'tourism.attraction': 'Attraction',
                    'shop.gift': 'Gift',
                    'tourism.camp_site': 'Camp Site',
                    'shop.greengrocer': 'Greengrocer',
                    'tourism.caravan_site': 'Caravan Site',
                    'shop.hairdresser': 'Hairdresser',
                    'tourism.chalet': 'Chalet',
                    'shop.hardware': 'Hardware',
                    'tourism.gallery': 'Gallery',
                    'shop.hifi': 'Hifi',
                    'tourism.guest_house': 'Guest House',
                    'shop.houseware': 'Houseware',
                    'tourism.hostel': 'Hostel',
                    'shop.interior_decoration': 'Interior Decoration',
                    'tourism.hotel': 'Hotel',
                    'shop.jewelry': 'Jewelry',
                    'tourism.hotel;campsite': 'Hotel/Campsite',
                    'shop.kiosk': 'Kiosk',
                    'tourism.information': 'Information',
                    'shop.laundry': 'Laundry',
                    'tourism.motel': 'Motel',
                    'shop.locksmith': 'Locksmith',
                    'tourism.museum': 'Museum',
                    'shop.mall': 'Mall',
                    'tourism.picnic_site': 'Picnic Site',
                    'shop.medical_supply': 'Medical Supply',
                    'tourism.ruins': 'Ruins',
                    'shop.mobile_phone': 'Mobile Phone',
                    'tourism.theme_park': 'Theme Park',
                    'shop.optician': 'Optician',
                    'tourism.viewpoint': 'Viewpoint',
                    'shop.pastry': 'Pastry',
                    'tourism.zoo': 'Zoo',
                    'shop.photo': 'Photo',
                    'waterway.boatyard': 'Boatyard',
                    'shop.photo_studio': 'Photo Studio',
                    'waterway.dam': 'Dam',
                    'shop.scuba_diving': 'Scuba Dviving',
                    'waterway.dock': 'Dock',
                    'waterway.wadi': 'Wadi',
                    'waterway.weir': 'Weir',
                    'waterway.waterfall': 'Waterfall'
                };

                var default_labels_hr_mapping = {
                    'aerialway cable_car': 'Cable Car',
                    'highway ford': 'Ford',
                    'aerialway station': 'Station',
                    'highway rest_area': 'Rest Area',
                    'aeroway aerodrome': 'Aerodrome',
                    'highway turning_circle': 'Turning Circle',
                    'aeroway hangar': 'Hangar',
                    'historic archaeological_site': 'Archaeological Site',
                    'aeroway helipad': 'Helipad',
                    'historic castle': 'Castle',
                    'aeroway terminal': 'Terminal',
                    'historic memorial': 'Memorial',
                    'amenity arts_centre': 'Arts Centre',
                    'historic meteor_crater': 'Meteor Crater',
                    'amenity atm': 'ATM',
                    'historic monument': 'Monument',
                    'amenity attraction': 'Attraction',
                    'historic ruins': 'Ruins',
                    'amenity bank': 'Bank',
                    'historic wayside_cross': 'Wayside Cross',
                    'amenity bar': 'Bar',
                    'historic wreck': 'Wreck',
                    'amenity bbq': 'BBQ',
                    'landuse basin': 'Basin',
                    'amenity bicycle_parking': 'Bicycle Parking',
                    'landuse farmland': 'Farmland',
                    'amenity bicycle_rental': 'Bicycle Rental',
                    'landuse farmyard': 'Farmyard',
                    'amenity biergarten': 'Biergarten',
                    'landuse reservoir': 'Reservoir',
                    'amenity boat_rental': 'Boat Rental',
                    'leisure common': 'Leisure - Common',
                    'amenity bureau_de_change': 'Bureau de Change',
                    'leisure garden': 'Garden',
                    'amenity bus_station': 'Bus Station',
                    'leisure golf_course': 'Golf Course',
                    'amenity cafe': 'Cafe',
                    'leisure horse_riding': 'Horse Riding',
                    'amenity car_rental': 'Car Rental',
                    'leisure hot_spring': 'Hot Spring',
                    'amenity car_wash': 'Car Wash',
                    'leisure ice_rink': 'Ice Rink',
                    'amenity childcare': 'Childcare',
                    'leisure marina': 'Marina',
                    'amenity cinema': 'Cinema',
                    'leisure nature_reserve': 'Nature Reserve',
                    'amenity clinic': 'Clinic',
                    'leisure park': 'Park',
                    'amenity college': 'College',
                    'leisure pitch': 'Pitch',
                    'amenity community_centre': 'Community Centre',
                    'leisure playground': 'Playground',
                    'amenity courthouse': 'Courthouse',
                    'leisure slipway': 'Slipway',
                    'amenity dentist': 'Dentist',
                    'leisure sports_centre': 'Sports Centre',
                    'amenity dive_centre': 'Dive Centre',
                    'leisure stadium': 'Stadium',
                    'amenity doctors': 'Doctors',
                    'leisure swimming_pool': 'Swimming Pool',
                    'amenity drinking_water': 'Drinking Water',
                    'leisure track': 'Track',
                    'amenity embassy': 'Embassy',
                    'man_made antenna': 'Antenna',
                    'amenity fast_food': 'Fast Food',
                    'man_made chimney': 'Chimney',
                    'amenity ferry_terminal': 'Ferry Terminal',
                    'man_made communications_tower': 'Communications Tower',
                    'amenity fire_station': 'Fire Station',
                    'man_made flagpole': 'Flagpole',
                    'amenity food_court': 'Food Court',
                    'man_made lighthouse': 'Lighthouse',
                    'amenity fountain': 'Fountain',
                    'man_made pier': 'Pier',
                    'amenity fuel': 'Fuel',
                    'man_made silo': 'Silo',
                    'amenity gym': 'Gym',
                    'man_made tower': 'Tower',
                    'amenity hospital': 'Hospital',
                    'man_made water_tank': 'Water Tank',
                    'amenity ice_cream': 'Ice Cream',
                    'man_made water_tower': 'Water Tower',
                    'amenity kindergarten': 'kindergarten',
                    'man_made water_well': 'Water Well',
                    'amenity library': 'Library',
                    'man_made windpump': 'Windpump',
                    'amenity marketplace': 'Marketplace',
                    'military attraction': 'Attraction',
                    'amenity monastery': 'Monastery',
                    'natural attraction': 'Attraction',
                    'amenity money_transfer': 'Money Transfer',
                    'natural bay': 'Bay',
                    'amenity nightclub': 'Nightclub',
                    'natural beach': 'Beach',
                    'amenity parking': 'Parking',
                    'natural cape': 'Cape',
                    'amenity parking_entrance': 'Parking Entrance',
                    'natural cave_entrance': 'Cave Entrance',
                    'amenity parking_space': 'Parking Space',
                    'natural cliff': 'Cliff',
                    'amenity pharmacy': 'Pharmacy',
                    'natural dune': 'Dune',
                    'amenity place_of_worship': 'Place of Worship',
                    'natural heath': 'Heath',
                    'amenity police': 'Police',
                    'natural hill': 'Hill',
                    'amenity post_box': 'Post Box',
                    'natural hills': 'Hills',
                    'amenity post_office': 'Post Office',
                    'natural massif': 'Massif',
                    'amenity pub': 'Pub',
                    'natural peak': 'Peak',
                    'amenity public_building': 'Public Building',
                    'natural peaks': 'Peaks',
                    'amenity ranger_station': 'Ranger Station',
                    'natural plateau': 'Plateau',
                    'amenity rescue_station': 'Rescue Station',
                    'natural protected_area': 'Protected Area',
                    'amenity restaurant': 'Restaurant',
                    'natural reef': 'Reef',
                    'amenity restaurant,bar': 'Restaurant/Bar',
                    'natural ridge': 'Ridge',
                    'amenity school': 'School',
                    'natural rock': 'Rock',
                    'amenity shelter': 'Shelter',
                    'natural rocks': 'Rock',
                    'amenity shower': 'Shower',
                    'natural sand': 'Sand',
                    'amenity swimming_pool': 'Swimming Pool',
                    'natural sand dune': 'Sand Dune',
                    'amenity taxi': 'Taxi',
                    'natural sandstone': 'Sandstone',
                    'amenity telephone': 'Telephone',
                    'natural spring': 'Spring',
                    'amenity theatre': 'Theatre',
                    'natural stone': 'Stone',
                    'amenity toilets': 'Toilets',
                    'natural tree': 'Tree',
                    'amenity townhall': 'Townhall',
                    'natural tree_row': 'Tree Row',
                    'amenity university': 'University',
                    'natural valley': 'Valley',
                    'amenity vending_machine': 'Vending Machine',
                    'natural water': 'Water',
                    'amenity veterinary': 'Veterinary',
                    'natural wetland': 'Wetland',
                    'amenity visitor_centre': 'Visitor Centre',
                    'natural wood': 'Wood',
                    'amenity waste_basket': 'Waste Basket',
                    'place city': 'City',
                    'amenity water_point': 'Water Point',
                    'place farm': 'Farm',
                    'boundary national_park': 'National Park',
                    'place hamlet': 'Hamlet',
                    'building apartments': 'Apartments',
                    'place island': 'Island',
                    'building attraction': 'Attraction',
                    'place islet': 'Islet',
                    'building cathedral': 'Cathedral',
                    'place isolated_dwelling': 'Isolated Dwelling',
                    'building church': 'Church',
                    'place locality': 'Locality',
                    'building civic': 'Civic',
                    'place mountain_range': 'Mountain Range',
                    'building commercial': 'Commercial',
                    'place neighbourhood': 'Neighbourhood',
                    'building garage': 'Garage',
                    'place region': 'Region',
                    'building greenhouse': 'Greenhouse',
                    'place suburb': 'Suburb',
                    'building hospital': 'Hospital',
                    'place town': 'Town',
                    'building hotel': 'Hotel',
                    'place village': 'Village',
                    'building hut': 'Hostel',
                    'railway crossing': 'Crossing',
                    'building industrial': 'Industrial',
                    'railway halt': 'Railway Halt',
                    'building office': 'Office',
                    'railway station': 'Railway Station',
                    'building public': 'Public',
                    'religion jewish': 'Jewish',
                    'building residential': 'Residential',
                    'shop alcohol': 'Alcohol',
                    'building school': 'School',
                    'shop art': 'Art',
                    'building stadium': 'Stadium',
                    'shop bakery': 'Bakery',
                    'building terrace': 'Terrace',
                    'shop beauty': 'Beauty',
                    'building university': 'University',
                    'shop beverages': 'Beverages',
                    'building yes': 'Yes',
                    'shop books': 'Books',
                    'highway bus_stop': 'Bus Stop',
                    'shop boutique': 'Boutique',
                    'highway footway': 'Footway',
                    'shop butcher': 'Butcher',
                    'shop car': 'Car',
                    'shop seafood': 'Seafood',
                    'shop car_parts': 'Car Parts',
                    'shop shoes': 'Shoes',
                    'shop car_repair': 'Car Repair',
                    'shop sports': 'Sports',
                    'shop chemist': 'Chemist',
                    'shop stationery': 'Stationery',
                    'shop clothes': 'Clothes',
                    'shop supermarket': 'Supermarket',
                    'shop computer': 'Computer',
                    'shop tailor': 'Tailor',
                    'shop confectionery': 'Confectionery',
                    'shop ticket': 'Ticket',
                    'shop convenience': 'Convenience',
                    'shop toys': 'Toys',
                    'shop copyshop': 'Copyshop',
                    'shop travel_agency': 'Travel Agency',
                    'shop department_store': 'Department Store',
                    'shop tyres': 'Tyres',
                    'shop dive': 'Dive',
                    'shop variety_store': 'Variety Store',
                    'shop dive_centre': 'Dive Centre',
                    'shop video': 'Video',
                    'shop diving': 'Diving',
                    'shop wholesale': 'Wholesale',
                    'shop doityourself': 'DoItYourself',
                    'shop wine': 'Wine',
                    'shop dry_cleaning': 'Dry Cleaning',
                    'shop yes': 'Yes',
                    'shop electronics': 'Electronics',
                    'site_type fortification': 'Fortification',
                    'shop fashion': 'Fashion',
                    'sport skiing': 'Skiing',
                    'shop fishmonger': 'Fishmonger',
                    'tourism alpine_hut': 'Alpine hut',
                    'shop florist': 'Florist',
                    'tourism apartment': 'Apartment',
                    'shop garden_centre': 'Garden Centre',
                    'tourism artwork': 'Artwork',
                    'shop general': 'General',
                    'tourism attraction': 'Attraction',
                    'shop gift': 'Gift',
                    'tourism camp_site': 'Camp Site',
                    'shop greengrocer': 'Greengrocer',
                    'tourism caravan_site': 'Caravan Site',
                    'shop hairdresser': 'Hairdresser',
                    'tourism chalet': 'Chalet',
                    'shop hardware': 'Hardware',
                    'tourism gallery': 'Gallery',
                    'shop hifi': 'Hifi',
                    'tourism guest_house': 'Guest House',
                    'shop houseware': 'Houseware',
                    'tourism hostel': 'Hostel',
                    'shop interior_decoration': 'Interior Decoration',
                    'tourism hotel': 'Hotel',
                    'shop jewelry': 'Jewelry',
                    'tourism hotel;campsite': 'Hotel/Campsite',
                    'shop kiosk': 'Kiosk',
                    'tourism information': 'Information',
                    'shop laundry': 'Laundry',
                    'tourism motel': 'Motel',
                    'shop locksmith': 'Locksmith',
                    'tourism museum': 'Museum',
                    'shop mall': 'Mall',
                    'tourism picnic_site': 'Picnic Site',
                    'shop medical_supply': 'Medical Supply',
                    'tourism ruins': 'Ruins',
                    'shop mobile_phone': 'Mobile Phone',
                    'tourism theme_park': 'Theme Park',
                    'shop optician': 'Optician',
                    'tourism viewpoint': 'Viewpoint',
                    'shop pastry': 'Pastry',
                    'tourism zoo': 'Zoo',
                    'shop photo': 'Photo',
                    'waterway boatyard': 'Boatyard',
                    'shop photo_studio': 'Photo Studio',
                    'waterway dam': 'Dam',
                    'shop scuba_diving': 'Scuba Dviving',
                    'waterway dock': 'Dock',
                    'waterway wadi': 'Wadi',
                    'waterway weir': 'Weir',
                    'waterway waterfall': 'Waterfall',
                    'picnic_site': 'Picnic Site'
                };

                $scope.categoryOSMtoEnglish = function(attribute) {
                    var value = $sce.valueOf(attribute.value);
                    if (angular.isDefined(osm_categ_hr_mapping[value])) return osm_categ_hr_mapping[value];
                    else return attribute.value;
                }

                $scope.defaultLabeltoEnglish = function(attribute) {
                    var value = $sce.valueOf(attribute.value);
                    if (angular.isDefined(default_labels_hr_mapping[value])) return default_labels_hr_mapping[value];
                    else return attribute.value;
                }
            }
        ]);

        return module;
    });
