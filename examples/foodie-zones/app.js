'use strict';

define(['angular', 'ol', 'sidebar', 'toolbar', 'layermanager', 'hs.source.SparqlJson', 'map', 'query', 'search', 'print', 'permalink', 'measure', 'legend', 'geolocation', 'core', 'api', 'angular-gettext', 'bootstrap', 'translations', 'compositions', 'status_creator', 'ows'],

    function(angular, ol, sidebar, toolbar, layermanager, SparqlJson) {
        var module = angular.module('hs', [
            'hs.toolbar',
            'hs.layermanager',
            'hs.map',
            'hs.query',
            'hs.search', 'hs.permalink', 'hs.measure',
            'hs.geolocation', 'hs.core',
            'hs.api',
            'gettext',
            'hs.sidebar'
        ]);

        module.directive('hs', ['hs.map.service', 'Core', function(OlMap, Core) {
            return {
                templateUrl: hsl_path + 'hslayers.html',
                link: function(scope, element) {
                    Core.fullScreenMap(element);
                }
            };
        }])
        
        .directive('hs.foodiezones.infoDirective', function() {
            return {
                templateUrl: './info.html?bust=' + gitsha,
                link: function(scope, element, attrs) {
                    $('#zone-info-dialog').modal('show');
                }
            };
        }).directive('description', ['$compile', 'hs.utils.service', function($compile, utils) {
            return {
                templateUrl: './description.html?bust=' + gitsha,
                scope: {
                    object: '=',
                    url: '@'
                },
                link: function(scope, element, attrs) {
                    scope.describe = function(e, attribute){
                        if(angular.element(e.target).parent().find('table').length>0){
                            angular.element(e.target).parent().find('table').remove();
                        } else {
                            var table = angular.element('<table class="table table-striped" description object="attribute'+Math.abs(attribute.value.hashCode())+'" url="'+attribute.value+'"></table>');
                            angular.element(e.target).parent().append(table);
                            $compile(table)(scope.$parent);
                        }
                    }
                    if(angular.isUndefined(scope.object) && angular.isDefined(attrs.url) && typeof attrs.url == 'string'){
                        scope.object = {attributes: []};
                        var q = 'https://www.foodie-cloud.org/sparql?default-graph-uri=&query=' + encodeURIComponent('describe <'+attrs.url+'>') + '&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on';
                        $.ajax({
                            url: utils.proxify(q)
                        })
                        .done(function(response) {
                            if(angular.isUndefined(response.results)) return;
                            for (var i = 0; i < response.results.bindings.length; i++) {    
                                var b = response.results.bindings[i];
                                var short_name = b.p.value;
                                if(short_name.indexOf('#')>-1) 
                                    short_name = short_name.split('#')[1];
                                scope.object.attributes.push({short_name: short_name, value: b.o.value});
                                if (!scope.$$phase) scope.$apply();
                            }
                        })
                    }
                }
            };
        }]);
        
        var style = function(feature, resolution) {
            if (typeof feature.get('visible') === 'undefined' || feature.get('visible') == true) {
                var s = feature.get('http://www.sdi4apps.eu/poi/#mainCategory');

                if (typeof s === 'undefined') return;
                s = s.split("#")[1];
                return [
                    new ol.style.Style({
                        image: new ol.style.Icon({
                            anchor: [0.5, 1],
                            src: 'hslayers-ng/examples/geosparql/symbolsWaze/' + s + '.png',
                            crossOrigin: 'anonymous',
                            scale: 0.6
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
                            src: 'hslayers-ng/examples/geosparql/symbols/' + s + '.png',
                            crossOrigin: 'anonymous',
                            scale: 0.6
                        })
                    })
                ]
            } else {
                return [];
            }
        }
        
        
        function rainbow(numOfSteps, step, opacity) {
            // based on http://stackoverflow.com/a/7419630
            // This function generates vibrant, "evenly spaced" colours (i.e. no clustering). This is ideal for creating easily distiguishable vibrant markers in Google Maps and other apps.
            // Adam Cole, 2011-Sept-14
            // HSV to RBG adapted from: http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
            var r, g, b;
            var h = step / (numOfSteps * 1.00000001);
            var i = ~~(h * 4);
            var f = h * 4 - i;
            var q = 1 - f;
            switch (i % 4) {
                case 2:
                    r = f, g = 1, b = 0;
                    break;
                case 0:
                    r = 0, g = f, b = 1;
                    break;
                case 3:
                    r = 1, g = q, b = 0;
                    break;
                case 1:
                    r = 0, g = 1, b = q;
                    break;
            }
            var c = "rgba(" + ~~(r * 235) + "," + ~~(g * 235) + "," + ~~(b * 235) + ", " + opacity + ")";
            return (c);
        }
        
        var stroke = new ol.style.Stroke({
            color: '#3399CC',
            width: 1.25
        });
              
        var mercatorProjection = ol.proj.get('EPSG:900913');

        module.value('config', {
            default_layers: [new ol.layer.Tile({
                    source: new ol.source.OSM({
                        wrapX: false
                    }),
                    title: "Base layer",
                    base: true
                })],
            //project_name: 'hslayers',
            default_view: new ol.View({
                center: ol.proj.transform([-8.796119, 41.942791], 'EPSG:4326', 'EPSG:3857'), //Latitude longitude    to Spherical Mercator
                zoom: 16,
                units: "m"
            })
        });

        module.controller('Main', ['$scope', 'Core', 'hs.query.baseService', 'hs.compositions.service_parser', '$timeout', 'hs.map.service', '$http', 'config', '$rootScope', 'hs.utils.service', '$compile', 'hs.query.wmsService', '$sce',
            function($scope, Core, QueryService, composition_parser, $timeout, hsMap, $http, config, $rootScope, utils, $compile, WmsService, $sce) {
                $scope.hsl_path = hsl_path; //Get this from hslayers.js file
                $scope.Core = Core;
                Core.sidebarExpanded = false;
                var map;
                var zones_source =  new ol.source.Vector();
                var olus_source =  new ol.source.Vector();
                var spoi_source =  new ol.source.Vector();
                
                $rootScope.$on('map.loaded', function(){
                    map = hsMap.map;
                    getZones();
                    map.on('moveend', extentChanged);
                });
                
                function extentChanged(){
                    getOlus();
                    getPois();
                }
                
                function getOlus(){
                    if(map.getView().getResolution() > 2.48657133911758) return;
                    var format = new ol.format.WKT();
                    var bbox = map.getView().calculateExtent(map.getSize());
                    var ext = ol.proj.transformExtent(bbox, 'EPSG:3857', 'EPSG:4326')
                    var extents = ext[0] + ' ' + ext[1] + ', ' +ext[2] + ' ' + ext[3];
                    var q = 'https://www.foodie-cloud.org/sparql?default-graph-uri=&query=' + encodeURIComponent(`PREFIX geo: <http://www.opengis.net/ont/geosparql#> 
                    PREFIX geof: <http://www.opengis.net/def/function/geosparql/> 
                    PREFIX virtrdf: <http://www.openlinksw.com/schemas/virtrdf#> 
                    PREFIX poi: <http://www.openvoc.eu/poi#> 
                    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> 
                    SELECT ?o ?wkt ?use 
                        FROM <http://w3id.org/foodie/olu#> 
                        WHERE { ?o geo:hasGeometry ?geometry. 
                            ?geometry geo:asWKT ?wkt. 
                            FILTER(bif:st_intersects(bif:st_geomfromtext("BOX(${extents})"), ?wkt)). 
                            ?o <http://w3id.org/foodie/olu#specificLandUse> ?use. 
                        }   
                    `) + '&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on';
                    
                    olus_source.set('loaded', false);
                    $.ajax({
                        url: utils.proxify(q)
                    })
                    .done(function(response) {
                            if(angular.isUndefined(response.results)) return;
                            var features = [];
                            for (var i = 0; i < response.results.bindings.length; i++) {
                                try {
                                    var b = response.results.bindings[i];
                                    if(b.wkt.datatype=="http://www.openlinksw.com/schemas/virtrdf#Geometry" && b.wkt.value.indexOf('e+') == -1 && b.wkt.value.indexOf('e-') == -1){
                                        var g_feature = format.readFeature(b.wkt.value.toUpperCase());
                                        var ext = g_feature.getGeometry().getExtent()
                                        var geom_transformed = g_feature.getGeometry().transform('EPSG:4326', hsMap.map.getView().getProjection());
                                        var feature = new ol.Feature({geometry: geom_transformed, parcel: b.o.value, use: b.use.value});
                                        features.push(feature);
                                    }
                                } catch(ex){
                                    console.log(ex);
                                }
                            }
                        olus_source.clear();
                        olus_source.addFeatures(features);
                        olus_source.set('loaded', true);
                    })
                }
                
                 function getPois(){
                    if(map.getView().getResolution() > 8.48657133911758) return;
                    var format = new ol.format.WKT();
                    var bbox = map.getView().calculateExtent(map.getSize());
                    var ext = ol.proj.transformExtent(bbox, 'EPSG:3857', 'EPSG:4326')
                    var extents = ext[0] + ' ' + ext[1] + ', ' +ext[2] + ' ' + ext[3];
                    var q = 'https://www.foodie-cloud.org/sparql?default-graph-uri=&query=' + encodeURIComponent(`PREFIX geo: <http://www.opengis.net/ont/geosparql#> 
                    PREFIX geof: <http://www.opengis.net/def/function/geosparql/> 
                    PREFIX virtrdf: <http://www.openlinksw.com/schemas/virtrdf#> 
                    PREFIX poi: <http://www.openvoc.eu/poi#> 
                    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> 
                    SELECT ?poi ?wkt ?sub ?label FROM <http://www.sdi4apps.eu/poi.rdf> 
                    WHERE {?poi geo:asWKT ?wkt . 
                        FILTER(bif:st_intersects(bif:st_geomfromtext("BOX(${extents})"), ?wkt)).
                        ?poi <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> ?sub. 
                        ?sub <http://www.w3.org/2000/01/rdf-schema#subClassOf> ?categ.
                        ?poi <http://www.w3.org/2000/01/rdf-schema#label> ?label
                    }`) + '&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on';
                    
                    spoi_source.set('loaded', false);
                    $.ajax({
                        url: utils.proxify(q)
                    })
                    .done(function(response) {
                            if(angular.isUndefined(response.results)) return;
                            var features = [];
                            for (var i = 0; i < response.results.bindings.length; i++) {
                                try {
                                    var b = response.results.bindings[i];
                                    if(b.wkt.datatype=="http://www.openlinksw.com/schemas/virtrdf#Geometry" && b.wkt.value.indexOf('e+') == -1 && b.wkt.value.indexOf('e-') == -1){
                                        var g_feature = format.readFeature(b.wkt.value.toUpperCase());
                                        var ext = g_feature.getGeometry().getExtent()
                                        var geom_transformed = g_feature.getGeometry().transform('EPSG:4326', hsMap.map.getView().getProjection());
                                        var feature = new ol.Feature({geometry: geom_transformed, poi: b.poi.value, category: b.sub.value, label: b.label.value});
                                        features.push(feature);
                                    }
                                } catch(ex){
                                    console.log(ex);
                                }
                            }
                        spoi_source.clear();
                        spoi_source.addFeatures(features);
                        spoi_source.set('loaded', true);
                    })
                }
           
                function createLayers() {
                                        
                    
                    config.default_layers.push(new ol.layer.Vector({
                        title: "Open land use parcels",
                        source: olus_source,
                        style: function(feature, resolution) {
                            var use = feature.get('use').split('/');
                            use = use[use.length-1];
                            return [
                                new ol.style.Style({
                                    stroke: new ol.style.Stroke({
                                        color: rainbow(350, use, 0.8),
                                        width: 2
                                    })
                                })
                            ];
                        },
                        visible: true
                    }));

                    config.default_layers.push(new ol.layer.Vector({
                        title: "Management zones colored by crop type",
                        source: zones_source,
                        style: function(feature, resolution) {
                            var crop = feature.get('crop').split('/');
                            crop = crop[crop.length-1];
                            var fill = new ol.style.Fill({
                                color: rainbow(30, crop, 0.7)
                            });
                            return [
                                new ol.style.Style({
                                    image: new ol.style.Circle({
                                    fill: fill,
                                        stroke: stroke,
                                        radius: 5
                                    }),
                                    text: new ol.style.Text({
                                        font: '12px helvetica,sans-serif',
                                        text: feature.get('crop description') + '\n'+feature.get('management zone').split('core/')[1],
                                        fill: new ol.style.Fill({
                                            color: '#000'
                                        }),
                                        stroke: new ol.style.Stroke({
                                            color: '#fff',
                                            width: 3
                                        })
                                    })
                                    ,
                                    fill: fill,
                                    stroke: stroke
                                })
                            ];
                        },
                        visible: true
                    }));
                    
                    config.default_layers.push(new ol.layer.Vector({
                        title: "Points of interest",
                        source: spoi_source,
                        style: function(feature, resolution) {
                            var s = feature.get('category');
                            if (typeof s === 'undefined') return;
                            s = s.split("#")[1];
                            var allowed = 'archaeological_site.png  artwork.png  bank.png      cafe.png       car_wash.png  fast_food.png  hotel.png        library.png   other.png    place_of_worship.png  restaurant.png   viewpoint.png     zoo.png arts_centre.png          atm.png      bus_stop.png  camp_site.png  dentist.png   fountain.png   information.png  memorial.png  parking.png  pub.png              supermarket.png  waste_basket.png';
                            if(allowed.indexOf(s + '.png')>-1)
                                s = 'symbols/' + s + '.png';
                            else
                                s = 'symbols/other.png'
                            return [
                                new ol.style.Style({
                                    image: new ol.style.Icon({
                                        anchor: [0.5, 1],
                                        src: s,
                                        size: [30, 35],
                                        crossOrigin: 'anonymous'
                                    })
                                })
                            ]
                        },
                        visible: true
                    }));
                    
                }
                
                createLayers();
                
                function getZones(){
                    //if(map.getView().getResolution() > 2.48657133911758) return;
                    var format = new ol.format.WKT();
                    var bbox = map.getView().calculateExtent(map.getSize());
                    var ext = ol.proj.transformExtent(bbox, 'EPSG:3857', 'EPSG:4326')
                    var extents = ext[0] + ' ' + ext[1] + ', ' +ext[2] + ' ' + ext[3];
                    var q = 'https://www.foodie-cloud.org/sparql?default-graph-uri=&query=' + encodeURIComponent(`PREFIX geo: <http://www.opengis.net/ont/geosparql#> 
                        PREFIX geof: <http://www.opengis.net/def/function/geosparql/> 
                        PREFIX virtrdf: <http://www.openlinksw.com/schemas/virtrdf#>  PREFIX foodie: <http://foodie-cloud.com/model/foodie#>
                        PREFIX foodie-es: <http://foodie-cloud.com/model/foodie-es#>
                        prefix iso19103: <http://def.seegrid.csiro.au/isotc211/iso19103/2005/basic#> 
                        SELECT * FROM <http://w3id.org/foodie/core/es#> WHERE {
                        ?z a foodie:ManagementZone. 
                        ?z foodie:cropSpecies ?crop.
                        ?z <http://www.opengis.net/ont/geosparql#hasGeometry> ?geom.
                        ?geom <http://www.opengis.net/ont/geosparql#asWKT> ?wkt.
                        ?prod foodie-es:productionTypeManagementZone ?z.
                        ?crop foodie:description ?crop_desc .
                        ?crop foodie:family ?crop_family .
                        ?crop foodie:genus ?crop_genus .
                        ?crop foodie:species ?crop_species .
                        ?crop foodie:variety ?crop_variety .
                        ?prod foodie-es:productionTypeManagementZone ?mzone .
                        ?prod a foodie:ProductionType .
                        ?prod foodie:productionDate ?prod_date .
                        ?prod foodie:productionAmount ?amount .
                        ?amount iso19103:uom ?amount_unit .
                        ?amount iso19103:value ?amount_value .
                        }`) + '&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on';
                    
                    zones_source.set('loaded', false);
                    $.ajax({
                        url: utils.proxify(q)
                    })
                    .done(function(response) {
                            if(angular.isUndefined(response.results)) return;
                            var features = [];
                            for (var i = 0; i < response.results.bindings.length; i++) {
                                try {
                                    var b = response.results.bindings[i];
                                    if(b.wkt.datatype=="http://www.openlinksw.com/schemas/virtrdf#Geometry" && b.wkt.value.indexOf('e+') == -1 && b.wkt.value.indexOf('e-') == -1){
                                        var g_feature = format.readFeature(b.wkt.value.toUpperCase());
                                        var ext = g_feature.getGeometry().getExtent()
                                        var geom_transformed = g_feature.getGeometry().transform('EPSG:4326', hsMap.map.getView().getProjection());
                                        var feature = new ol.Feature({geometry: geom_transformed, 
                                            crop: b.crop.value, 
                                            'crop description': b.crop_desc.value,
                                            'crop family': b.crop_family.value,
                                            'management zone': b.z.value,
                                            'production date': b.prod_date.value,
                                            amount: parseFloat(b.amount_value.value) + ' ' + b.amount_unit.value
                                        });
                                        features.push(feature);
                                    }
                                } catch(ex){
                                    console.log(ex);
                                }
                            }
                        zones_source.clear();
                        zones_source.addFeatures(features);
                        zones_source.set('loaded', true);
                    })
                }
                
                
                /*Popups*/
                function initInfoDirective(){
                    var el = angular.element('<div hs.foodiezones.info-directive></div>');
                    $("#hs-dialog-area").append(el)
                    $compile(el)($scope);
                } 
                
                initInfoDirective();
                    
                var popup;
                
                function showPopup(zone){
                    if (angular.isUndefined(popup)) createPopup();
                    if (!$scope.$$phase) $scope.$apply(); 
                    var html = $('#zone-info-offline')[0];
                    popup.show(QueryService.last_coordinate_clicked, html);
                    $rootScope.$broadcast('popupOpened','inside');
                }
                
                $scope.showInfo = function(zone) {
                    var id, obj_type;
                    if(zone.get('management zone')) {id = zone.get('management zone'); obj_type = 'Management Zone'}
                    if(zone.get('poi')) {id = zone.get('poi'); obj_type = 'Point of interest'}
                    if(zone.get('parcel')) {id = zone.get('parcel'); obj_type = 'Land use parcel'}
                    $scope.zone = {
                        id: $sce.trustAsHtml(), 
                        attributes: [],
                        links: [],
                        obj_type : obj_type
                    };
                    describeOlu(id, function(){
                        showPopup(zone);
                    });  
                }
                
                function describeOlu(id, callback){
                    var q = 'https://www.foodie-cloud.org/sparql?default-graph-uri=&query=' + encodeURIComponent('describe <'+id+'>') + '&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on';
                        $.ajax({
                            url: utils.proxify(q)
                        })
                        .done(function(response) {
                            if(angular.isUndefined(response.results)) return;
                            for (var i = 0; i < response.results.bindings.length; i++) {    
                                var b = response.results.bindings[i];
                                var short_name = b.p.value;
                                if(short_name.indexOf('#')>-1) 
                                    short_name = short_name.split('#')[1];
                                $scope.zone.attributes.push({short_name: short_name, value: b.o.value});
                            }
                            getLinksTo(id, callback);
                        })
                }
                
                function getLinksTo(id, callback){
                     var q = 'https://www.foodie-cloud.org/sparql?default-graph-uri=&query=' + encodeURIComponent('PREFIX geo: <http://www.opengis.net/ont/geosparql#> PREFIX geof: <http://www.opengis.net/def/function/geosparql/> PREFIX virtrdf: <http://www.openlinksw.com/schemas/virtrdf#> PREFIX poi: <http://www.openvoc.eu/poi#> PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> SELECT * WHERE {?obj <http://www.opengis.net/ont/geosparql#hasGeometry> ?obj_geom. ?obj_geom geo:asWKT ?Coordinates . FILTER(bif:st_intersects (?Coordinates, ?wkt)). { SELECT ?wkt WHERE { <'+id+'> geo:hasGeometry ?geometry. ?geometry geo:asWKT ?wkt.} } }') + '&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on';
                        $.ajax({
                            url: utils.proxify(q)
                        })
                        .done(function(response) {
                                for (var i = 0; i < response.results.bindings.length; i++) {    
                                    var b = response.results.bindings[i];
                                    $scope.zone.links.push({url: b.obj.value});
                                }
                                callback();
                        })
                }
                
                $scope.describePoi = function(poi){
                    if(angular.isUndefined(poi.expanded)) poi.expanded = false;
                    poi.expanded = !poi.expanded;
                    if(poi.expanded) {
                        var q = 'https://www.foodie-cloud.org/sparql?default-graph-uri=&query=' + encodeURIComponent('describe <'+poi.url+'>') + '&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on';
                        $.ajax({
                            url: utils.proxify(q)
                        })
                        .done(function(response) {
                            if(angular.isUndefined(response.results)) return;
                            poi.attributes = [];
                            for (var i = 0; i < response.results.bindings.length; i++) {    
                                var b = response.results.bindings[i];
                                var short_name = b.p.value;
                                if(short_name.indexOf('#')>-1) 
                                    short_name = short_name.split('#')[1];
                                poi.attributes.push({short_name: short_name, value: b.o.value});
                            }
                            if (!$scope.$$phase) $scope.$apply(); 
                        })
                    } else {
                        if (!$scope.$$phase) $scope.$apply(); 
                    }
                    return false;
                }
                
                function createPopup(){
                    popup = new ol.Overlay.Popup();
                    hsMap.map.addOverlay(popup);
                    popup.getElement().className += " popup-headline";
                    popup.getElement().style.width = '600px';
                    popup.getElement().style.height = 'auto';
                }
                
                $scope.$on('infopanel.feature_selected', function(event, feature) {
                    $scope.showInfo(feature);
                })
                
                $scope.$on('popupOpened', function(e,source){
                    if (angular.isDefined(source) && source != "inside"  && angular.isDefined(popup)) popup.hide();
                })
                
                $scope.$on('query.dataUpdated', function(event) {
                    if (console) console.log('Attributes',  QueryService.data.attributes, 'Groups', QueryService.data.groups);
                });
                
                Core.setMainPanel('info');
                Core.panelEnabled('compositions', false);
                Core.panelEnabled('status_creator', false);
            }
        ]);

        return module;
    });
