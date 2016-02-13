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

        module.controller('Main', ['$scope', '$filter', 'Core', 'hs.map.service', 'hs.query.service_infopanel', '$sce', '$http', 'config',
            function($scope, $filter, Core, OlMap, InfoPanelService, $sce, $http, config) {
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
                
                var hr_mappings;
                $http({
                    method: 'GET',
                    url: 'data.json'
                }).then(function successCallback(response) {
                    hr_mappings = response.data;
                    angular.forEach(hr_mappings["http://www.openvoc.eu/poi#categoryWaze"], function(name, category){
                        var new_lyr = new ol.layer.Vector({
                        title: " " + name,
                        source: new SparqlJson({
                                geom_attribute: '?geom',
                                url: 'http://data.plan4all.eu/sparql?default-graph-uri=&query=' + encodeURIComponent('SELECT ?o ?p ?s FROM <http://www.sdi4apps.eu/poi.rdf> WHERE { ?o <http://www.openvoc.eu/poi#categoryWaze> <' + category + '>. ?o <http://www.opengis.net/ont/geosparql#asWKT> ?geom. FILTER(isBlank(?geom) = false). ') + '<extent>' + encodeURIComponent('	?o ?p ?s } ORDER BY ?o') + '&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on',
                                updates_url: 'http://data.plan4all.eu/sparql?default-graph-uri=&query=' + encodeURIComponent('SELECT ?o ?date ?attr ?value FROM <http://www.sdi4apps.eu/poi.rdf> FROM <http://www.sdi4apps.eu/poi_changes.rdf> WHERE { ?o <http://www.openvoc.eu/poi#categoryWaze> <' + category + '>. ?o <http://www.opengis.net/ont/geosparql#asWKT> ?geom. FILTER(isBlank(?geom) = false). ') + '<extent>' + encodeURIComponent(' ?o <http://purl.org/dc/elements/1.1/identifier> ?id. ?c <http://www.sdi4apps.eu/poi_changes/poi_id> ?id. ?c <http://purl.org/dc/terms/1.1/created> ?date. ?c <http://www.sdi4apps.eu/poi_changes/attribute_set> ?attr_set. ?attr_set ?attr ?value } ORDER BY ?o ?date ?attr ?value') + '&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on',
                                category_field: 'http://www.openvoc.eu/poi#categoryWaze',
                                projection: 'EPSG:3857'
                                    //feature_loaded: function(feature){feature.set('hstemplate', 'hs.geosparql_directive')}
                            }),
                            style: style,
                            visible: false,
                            path: 'Points of interest'
                        });
                        config.box_layers[1].getLayers().insertAt(0, new_lyr);
                        OlMap.map.addLayer(new_lyr);
                    })
                    angular.forEach(hr_mappings.popular_categories, function(name, category){
                        var new_lyr = new ol.layer.Vector({
                            title: " " + name,
                            source: new SparqlJson({
                                geom_attribute: '?geom',
                                url: 'http://data.plan4all.eu/sparql?default-graph-uri=&query=' + encodeURIComponent('SELECT ?o ?p ?s FROM <http://www.sdi4apps.eu/poi.rdf> WHERE { ?o <http://www.openvoc.eu/poi#categoryOSM> ?filter_categ. ?o <http://www.opengis.net/ont/geosparql#asWKT> ?geom. FILTER(isBlank(?geom) = false). FILTER (str(?filter_categ) = "' + category + '"). ') + '<extent>' + encodeURIComponent('	?o ?p ?s } ORDER BY ?o') + '&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on',
                                updates_url: 'http://data.plan4all.eu/sparql?default-graph-uri=&query=' + encodeURIComponent('SELECT ?o ?date ?attr ?value FROM <http://www.sdi4apps.eu/poi.rdf> FROM <http://www.sdi4apps.eu/poi_changes.rdf> WHERE { ?o <http://www.openvoc.eu/poi#categoryOSM> ?filter_categ. ?o <http://www.opengis.net/ont/geosparql#asWKT> ?geom. FILTER(isBlank(?geom) = false). FILTER (str(?filter_categ) = "' + category + '"). ') + '<extent>' + encodeURIComponent(' ?o <http://purl.org/dc/elements/1.1/identifier> ?id. ?c <http://www.sdi4apps.eu/poi_changes/poi_id> ?id. ?c <http://purl.org/dc/terms/1.1/created> ?date. ?c <http://www.sdi4apps.eu/poi_changes/attribute_set> ?attr_set. ?attr_set ?attr ?value } ORDER BY ?o ?date ?attr ?value') + '&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on',
                                category_field: 'http://www.openvoc.eu/poi#categoryOSM',
                                projection: 'EPSG:3857'
                            }),
                            style: styleOSM,
                            visible: false,
                            path: 'Popular Categories'
                        });
                        config.box_layers[1].getLayers().insertAt(0, new_lyr);
                        OlMap.map.addLayer(new_lyr);
                    })
                })

                $scope.makeHumanReadable = function(attribute) {
                    var value = $sce.valueOf(attribute.value);
                    var name = $sce.valueOf(attribute.name);
                    if (angular.isDefined(hr_mappings[name][value])) return hr_mappings[name][value];
                    else return attribute.value;
                }

                $scope.attrToEnglish = function(name) {
                    var hr_names = {
                        'http://xmlns.com/foaf/0.1/mbox': 'E-mail: ',
                        'http://www.openvoc.eu/poi#fax': 'Fax: ',
                        'http://xmlns.com/foaf/0.1/phone': 'Phone: ',
                        'http://www.openvoc.eu/poi#address': 'Address: ',
                        'http://www.openvoc.eu/poi#openingHours': 'Opening Hours: ',
                        'http://www.openvoc.eu/poi#access': 'Access: ',
                        'http://www.openvoc.eu/poi#accessibility': 'Accessibility: ',
                        'http://www.openvoc.eu/poi#internetAccess': 'Internet Acces: '
                    }
                    return hr_names[name];
                }

                $scope.startEdit = function(attribute, x) {
                    attribute.is_editing = !(angular.isDefined(attribute.is_editing) && attribute.is_editing);
                }

                $scope.attributesHaveChanged = function(attributes) {
                    var tmp = false;
                    angular.forEach(attributes, function(a) {
                        if (angular.isDefined(a.changed) && a.changed) tmp = true;
                    })
                    return tmp;
                }

                function generateUuid() {
                    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                        var r = Math.random() * 16 | 0,
                            v = c == 'x' ? r : r & 0x3 | 0x8;
                        return v.toString(16);
                    });
                };

                $scope.saveSpoiChanges = function(attributes) {
                    var identifier = '';
                    var changes = [];
                    angular.forEach(attributes, function(a) {
                        if (angular.isDefined(a.changed) && a.changed) {
                            changes.push({
                                attribute: a.name,
                                value: $sce.valueOf(a.value)
                            });
                            InfoPanelService.feature.set(a.name, $sce.valueOf(a.value));
                        }
                        if (a.name == 'http://purl.org/dc/elements/1.1/identifier') identifier = $sce.valueOf(a.value);
                    })
                    var lines = [];
                    var d = new Date();
                    var n = d.toISOString();
                    var change_id = 'http://www.sdi4apps.eu/poi_changes/change_' + generateUuid();
                    var attribute_set_id = 'http://www.sdi4apps.eu/poi_changes/attributes_' + generateUuid();
                    lines.push('<' + change_id + '> <http://www.sdi4apps.eu/poi_changes/poi_id> <' + identifier + '>');
                    lines.push('<' + change_id + '> <http://purl.org/dc/terms/1.1/created> "' + n + '"^^xsd:dateTime');
                    lines.push('<' + change_id + '> <http://www.sdi4apps.eu/poi_changes/attribute_set> <' + attribute_set_id + '>');
                    angular.forEach(changes, function(a) {
                        lines.push('<' + attribute_set_id + '> <' + a.attribute + '> "' + a.value + '"');
                    })

                    var query = ['INSERT DATA { GRAPH <http://www.sdi4apps.eu/poi_changes.rdf> {', lines.join('.'), '}}'].join('\n');
                    $.ajax({
                            url: 'http://data.plan4all.eu/sparql?default-graph-uri=&query=' + encodeURIComponent(query) + '&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on'
                        })
                        .done(function(response) {
                            angular.forEach(attributes, function(a) {
                                if (angular.isDefined(a.changed) && a.changed) {
                                    delete a.changed;
                                }
                            })
                            if (!$scope.$$phase) $scope.$digest();
                        });
                }
            }
        ]).filter('usrFrSpoiAttribs', function() {
            return function(items) {
                var filtered = [];
                var frnly_attribs = ['http://www.w3.org/2000/01/rdf-schema#comment', 'http://xmlns.com/foaf/0.1/mbox', 'http://www.openvoc.eu/poi#fax']
                angular.forEach(items, function(item) {
                    if (frnly_attribs.indexOf(item.name) > -1) {
                        filtered.push(item);
                    }
                });
                return filtered;
            };
        });

        return module;
    });
