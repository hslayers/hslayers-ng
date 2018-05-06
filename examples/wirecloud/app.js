'use strict';

define(['angular', 'ol', 'toolbar', 'layermanager', 'sidebar', 'map', 'ows', 'query', 'search', 'print', 'permalink', 'measure', 'bootstrap', 'legend', 'panoramio', 'geolocation', 'core', 'wirecloud', 'angular-gettext', 'translations'],

    function(angular, ol, toolbar, layermanager) {
        var modules_to_load = [
            'hs.toolbar',
            'hs.layermanager',
            'hs.map',
            'hs.ows',
            'hs.query',
            'hs.search', 'hs.print', 'hs.permalink', 'hs.measure',
            'hs.legend', 'hs.geolocation', 'hs.core', 'hs.wirecloud', 'gettext', 'hs.sidebar'
        ];

        if (typeof MashupPlatform !== 'undefined') {
            modules_to_load = eval(MashupPlatform.prefs.get('modules_to_load'));
        }

        var module = angular.module('hs', modules_to_load);

        module.directive('hs', ['hs.map.service', 'Core', function(OlMap, Core) {
            return {
                templateUrl: hsl_path + 'hslayers.html',
                link: function(scope, element) {
                    Core.fullScreenMap(element);
                }
            };
        }]);

        var location_layer = new ol.layer.Vector({
            title: "Locations",
            show_in_manager: true,
            source: new ol.source.Vector(),
            style: function(feature, resolution) {
                return [new ol.style.Style({
                    text: new ol.style.Text({
                        text: feature.get('temperature'),
                        offsetY: -10,
                        offsetX: 5,
                        fill: new ol.style.Fill({
                            color: '#000'
                        })
                    }),
                    image: new ol.style.Circle({
                        fill: new ol.style.Fill({
                            color: feature.color ? feature.color : [242, 121, 0, 0.7]
                        }),
                        stroke: new ol.style.Stroke({
                            color: [0x33, 0x33, 0x33, 0.9]
                        }),
                        radius: 5
                    })
                })]
            }
        });

        var extent_layer = new ol.layer.Vector({
            title: "Locations",
            show_in_manager: true,
            source: new ol.source.Vector(),
            style: function(feature, resolution) {
                return [new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: '#005CB6',
                        width: 3
                    }),
                    fill: new ol.style.Fill({
                        color: 'rgba(0, 0, 255, 0.1)'
                    })
                })]
            }
        });

        var location_feature_ids = {};

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


        function processObject(data) {
            //Get settings from configuration
            var id_attr_name = MashupPlatform.prefs.get('id_attr_name');
            var coordinates_attr_name = MashupPlatform.prefs.get('coordinates_attr_name');
            var measurements_attr_names = MashupPlatform.prefs.get('measurements_attr_names').split(',');
            var timestamp_attr_name = MashupPlatform.prefs.get('timestamp_attr_name');

            //Read attributes
            var attributes = {
                id: data[id_attr_name],
                timestamp: data[timestamp_attr_name]
            };
            var projection = 'EPSG:4326';
            if (angular.isUndefined(data[coordinates_attr_name])) return;
            var coords = data[coordinates_attr_name].split(','); //Supposed ccordinates are lon, lat seperated by comma
            attributes.geometry = new ol.geom.Point(ol.proj.transform([parseFloat(coords[1]), parseFloat(coords[0])], projection, 'EPSG:3857'));
            for (var attr_i = 0; attr_i < measurements_attr_names.length; attr_i++) {
                var t = parseFloat(data[measurements_attr_names[attr_i]]);
                attributes[measurements_attr_names[attr_i]] = t.toFixed(2);
            }

            //Create feature if necessary. Set the attribute values for the feature 
            var feature = null;
            if (location_feature_ids[data[id_attr_name]]) {
                feature = location_feature_ids[data[id_attr_name]];
                feature.setGeometry(attributes.geometry);
                for (var atr in attributes) {
                    feature.set(atr, attributes[atr]);
                }
            } else {
                feature = new ol.Feature(attributes);
                location_layer.getSource().addFeatures([feature]);
                location_feature_ids[data[id_attr_name]] = feature;
            }

            //Compute color
            //feature.color = rainbow(30, Math.min(Math.max(max_temp, -15), 15) + 15, 0.7);
        }

        function processUnit(data) {
            var attributes = {
                id: data.id
            };
            var projection = 'EPSG:4326';
            /*for(var meta_i; meta_i<attr.metadatas.length; meta_i++){
                if(attr.metadatas[meta_i].name=="location")
                    projection = attr.metadatas[meta_i].value;
            }*/
            var coords = data.position.split(',');
            attributes.geometry = new ol.geom.Point(ol.proj.transform([parseFloat(coords[1]), parseFloat(coords[0])], projection, 'EPSG:3857'));
            attributes.timestamp = data.timestamp;

            var feature = null;
            if (location_feature_ids[data.id]) {
                feature = location_feature_ids[data.id];
                feature.setGeometry(attributes.geometry);
                for (var atr in attributes) {
                    feature.set(atr, attributes[atr]);
                }
            } else {
                feature = new ol.Feature(attributes);
                feature.tags = {};
                location_layer.getSource().addFeatures([feature]);
                location_feature_ids[data.id] = feature;
            }
        }

        function processTag(data) {
            if (location_feature_ids[data.unit]) {
                location_feature_ids[data.unit].tags[data.id] = data;
                var max_temp = -273.15;
                var timestamp = "";
                for (var tag in location_feature_ids[data.unit].tags) {
                    var t = parseFloat(location_feature_ids[data.unit].tags[tag].temperature);
                    max_temp = t > max_temp ? t : max_temp;
                    timestamp = location_feature_ids[data.unit].tags[tag].timestamp;
                }
                location_feature_ids[data.unit].color = rainbow(30, Math.min(Math.max(max_temp, -15), 15) + 15, 0.7);
                location_feature_ids[data.unit].set("max_temp", max_temp.toFixed(2) + " °C");
                location_feature_ids[data.unit].set("timestamp", timestamp);
            }
        }

        module.value('config', {
            default_layers: [
                new ol.layer.Tile({
                    source: new ol.source.OSM(),
                    show_in_manager: true,
                    title: "Base layer",
                    base: true
                }),
                location_layer,
                extent_layer
            ],
            wirecloud_data_consumer: function(data) {
                data = angular.fromJson(data);
                if (console) console.log(data);
                if (typeof data.type !== 'undefined') {
                    switch (data.type) {
                        /*case "Unit":
                            processUnit(data);
                            break;
                        case "Tag":
                            processTag(data);
                            break;*/
                        default: processObject(data);
                    }
                } else {
                    process_object(data);
                }
            },
            default_view: new ol.View({
                center: ol.proj.transform([17.474129, 52.574000], 'EPSG:4326', 'EPSG:3857'), //Latitude longitude    to Spherical Mercator
                zoom: 4,
                units: "m"
            })
        });

        module.controller('Main', ['$scope', 'Core', 'hs.query.baseService', 'config',
            function($scope, Core, QueryService, config) {
                $scope.hsl_path = hsl_path; //Get this from hslayers.js file
                $scope.Core = Core;

                $scope.$on('query.dataUpdated', function(event) {
                    if (console) console.log('Attributes', QueryService.data.attributes, 'Groups', QueryService.data.groups);
                });

                if (typeof MashupPlatform !== 'undefined')
                    MashupPlatform.wiring.registerCallback("data_received_slot", config.wirecloud_data_consumer);

                //This is needed because data can arrive before hslayers is loaded, so we store it in tmp and process later.
                for (var i = 0; i < tmp_data_received.length; i++) {
                    config.wirecloud_data_consumer(tmp_data_received[i]);
                }

            }
        ]);

        return module;
    });
