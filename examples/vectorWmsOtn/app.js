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
        
        var accident_style = function(feature, resolution) {
            if(feature.cashed_style) return feature.cashed_style;
            var sum_severity = {fatal:0, serious:0, slight:0};
            for (var i = 0; i < feature.get('features').length; i++) {
                var year_data = feature.get('features')[i].get('year_2005');
                sum_severity.fatal+=year_data.structure.severity.fatal;
                sum_severity.serious+=year_data.structure.severity.serious;
                sum_severity.slight+=year_data.structure.severity.slight;
            }
            var total = sum_severity.fatal+sum_severity.serious+sum_severity.slight;
            var size = Math.floor(50 + total / resolution * 3);
            console.log(resolution);
            feature.cashed_style = [new ol.style.Style({
                image: new ol.style.Icon({
                    src: 'http://chart.apis.google.com/chart?chs=' + size + 'x' + size + '&chf=bg,s,ffffff00&chdlp=b&chd=t:' + [sum_severity.fatal/total, sum_severity.serious/total, sum_severity.slight/total].join() + '&cht=p&chco=ce2402cc,e5d032cc,099700cc',
                    crossOrigin: 'anonymous'
                })
            })];

            return feature.cashed_style; 
        }

        var src = new ol.source.GeoJSON({
            url: hsl_path + 'examples/vectorWmsOtn/shluky.geojson',
            projection: 'EPSG:3857'
        });
        var csrc = new ol.source.Cluster({
            distance: 150,
            source: src
        });

        module.value('default_layers', [
            new ol.layer.Tile({
                source: new ol.source.OSM(),
                title: "Base layer",
                box_id: 'osm',
                base: true
            }),
            new ol.layer.Vector({
                title: "Accidents",
                source: new WfsSource({
                    url: 'http://gis.lesprojekt.cz/cgi-bin/mapserv?map=/home/dima/maps/accidents_wfs.map',
                    typename: 'accidents',
                    projection: 'EPSG:3857'
                }),
                style: style
            }),
            new ol.layer.Vector({
                title: "Accident statistics",
                source: csrc,
                style: accident_style
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
