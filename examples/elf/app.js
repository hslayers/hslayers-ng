'use strict';

define(['ol', 'toolbar', 'layermanager', 'WfsSource', 'query', 'search', 'print', 'permalink', 'measure', 'geolocation', 'api'],

    function(ol, toolbar, layermanager, WfsSource) {
        var module = angular.module('hs', [
            'hs.toolbar',
            'hs.layermanager',
            'hs.query',
            'hs.search', 'hs.print', 'hs.permalink',
            'hs.geolocation',
            'hs.api'
        ]);

        module.directive('hs', ['hs.map.service', 'Core', function(OlMap, Core) {
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

        var gm = new ol.format.GML3();
        for (var key in gm) {
            if (key.indexOf("_PARSERS") > 0)
                gm[key]["http://www.opengis.net/gml/3.2"] = gm[key]["http://www.opengis.net/gml"];
        }

        var feature_parser = function(response) {
            var features = [];
            $("member", response).each(function() {
                var attrs = {};
                var geom_node = $("geometry", this).get(0) || $("CP\\:geometry", this).get(0);
                attrs.geometry = gm.readGeometryElement(geom_node, [{}]);
                var feature = new ol.Feature(attrs);
                features.push(feature);
            });
            return features;
        }

        module.value('default_layers', [
            new ol.layer.Tile({
                source: new ol.source.OSM(),
                title: "Base layer",
                base: true
            }),
            new ol.layer.Vector({
                title: "Parcels",
                maxResolution: 1.2,
                source: new WfsSource({
                    url: 'http://services.cuzk.cz/wfs/inspire-cp-wfs.asp',
                    typename: 'CP:CadastralParcel',
                    projection: 'EPSG:3857',
                    version: '2.0.0',
                    format: new ol.format.WFS(),
                    hsproxy: true,
                    parser: feature_parser
                }),
                style: style
            }),
            new ol.layer.Vector({
                title: "Buildings",
                maxResolution: 2.4,
                source: new WfsSource({
                    url: 'https://54.247.162.180/wss/service/CZ-AD/httpauth',
                    typename: 'AD:Address',
                    projection: 'EPSG:3857',
                    version: '2.0.0',
                    format: new ol.format.WFS(),
                    hsproxy: true,
                    beforeSend: function(xhr) {
                        xhr.setRequestHeader("Authorization", "Basic " + btoa("WRLS" + ":" + "WRLSELFx1"));
                    },
                    parser: feature_parser
                }),
                style: style
            })
        ]);

        module.value('default_view', new ol.View({
            center: ol.proj.transform([17.474129, 52.574000], 'EPSG:4326', 'EPSG:3857'), //Latitude longitude    to Spherical Mercator
            zoom: 4,
            units: "m"
        }));

        module.controller('Main', ['$scope', 'Core', 'hs.query.service_infopanel',
            function($scope, Core, InfoPanelService) {
                if (console) console.log("Main called");
                $scope.hsl_path = hsl_path; //Get this from hslayers.js file
                $scope.Core = Core;

                $scope.$on('infopanel.updated', function(event) {});
            }
        ]);

        return module;
    });
