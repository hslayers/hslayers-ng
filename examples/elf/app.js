'use strict';

define(['angular', 'ol', 'toolbar', 'layermanager', 'WfsSource', 'core', 'map', 'query', 'search', 'print', 'permalink', 'measure', 'geolocation', 'api', 'angular-gettext', 'translations'],

    function(angular, ol, toolbar, layermanager, WfsSource) {
        var module = angular.module('hs', [
            'hs.core',
            'hs.toolbar',
            'hs.layermanager',
            'hs.map',
            'hs.query',
            'hs.search', 'hs.print', 'hs.permalink',
            'hs.geolocation',
            'hs.api',
            'gettext'
        ]);

        module.directive('hs', ['OlMap', 'Core', function(OlMap, Core) {
            return {
                templateUrl: hsl_path + 'hslayers.html',
                link: function(scope, element) {
                    Core.fullscreenMap(element);
                }
            };
        }]);

        module.value('box_layers', []);

        var style = new ol.style.Style({
            image: new ol.style.Circle({
                fill: new ol.style.Fill({
                    color: [242, 121, 0, 0.7]
                }),
                stroke: new ol.style.Stroke({
                    color: [0xbb, 0x33, 0x33, 0.7]
                }),
                radius: 5
            }),
            fill: new ol.style.Fill({
                color: "rgba(139, 189, 214, 0.3)",
            }),
            stroke: new ol.style.Stroke({
                color: '#112211',
                width: 1
            })
        })

        module.value('default_layers', [
            new ol.layer.Tile({
                source: new ol.source.OSM(),
                title: "Base layer",
                box_id: 'osm',
                base: true
            }),
            new ol.layer.Vector({
                title: "NUTS points",
                source: new WfsSource({
                    url: 'https://54.247.162.180/wss/service/CZ-AD/httpauth',
                    typename: 'AD:Address',
                    projection: 'EPSG:3857',
                    version: '2.0.0',
                    format: new ol.format.WFS(),
                    hsproxy: true,
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader("Authorization", "Basic " + btoa("WRLS" + ":" + "WRLSELFx1")); 
                    },
                    parser: function(response) {
                        if(console) console.log(response);
                        var features = [];
                        $("member", response).each(function(){
                            debugger;
                            var attrs = {};
                            var geom_node = $("geometry", this).get(0);
                            attrs.geometry = ol.format.GMLBase.prototype.readGeometryElement(geom_node, [{}]);
                            var feature = new ol.Feature(attrs);
                            features.push(feature);
                        });
                        return features;
                    }
                }),
                style: style
            })
        ]);

        module.value('default_view', new ol.View({
            center: ol.proj.transform([17.474129, 52.574000], 'EPSG:4326', 'EPSG:3857'), //Latitude longitude    to Spherical Mercator
            zoom: 4,
            units: "m"
        }));

        module.controller('Main', ['$scope', 'Core', 'InfoPanelService',
            function($scope, Core, InfoPanelService) {
                if (console) console.log("Main called");
                $scope.hsl_path = hsl_path; //Get this from hslayers.js file
                $scope.Core = Core;

                $scope.$on('infopanel.updated', function(event) {});
            }
        ]);

        return module;
    });
