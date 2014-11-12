'use strict';

define(['angular', 'toolbar', 'ol', 'layermanager', 'map', 'ows', 'query', 'search', 'print', 'permalink', 'lodexplorer', 'measure', 'legend'],

    function(angular, toolbar, oj, layermanager) {
        var module = angular.module('hs', [
            'hs.toolbar',
            'hs.layermanager',
            'hs.map',
            'hs.ows',
            'hs.query',
            'hs.search',
            'hs.print',
            'hs.permalink',
            'hs.lodexplorer',
            'hs.measure',
            'hs.legend'
        ]);

        module.directive('hs', function() {
            return {
                templateUrl: hsl_path+'hslayers.html'
            };
        });
        
        module.value('box_layers', [
            {id:'armenia', 'img':'armenia.png', title:'Armenia', base_layer:true},
            {id:'osm', 'img':'osm.png', title:'Open street map', base_layer:true},
             {id:'osm', 'img':'osm.png', title:'Open street map', base_layer:true},
              {id:'osm', 'img':'osm.png', title:'Open street map', base_layer:true},
               {id:'osm', 'img':'osm.png', title:'Open street map', base_layer:true},
               {id:'osm', 'img':'osm.png', title:'Open street map', base_layer:true}
        ]);

        module.value('default_layers', [
            new ol.layer.Tile({
                source: new ol.source.OSM(),
                title: "Base layer",
                box_id: 'osm',
                base: true
            })
        ]);

        module.value('default_view', new ol.View({
            center: ol.proj.transform([17.474129, 52.574000], 'EPSG:4326', 'EPSG:3857'), //Latitude longitude    to Spherical Mercator
            zoom: 4,
            units: "m"
        }));

        
        
        
        
        
        
        
        
        
        module.controller('Main', ['$scope', 'ToolbarService', 'OwsWmsLayerProducer', 'InfoPanelService',
            function($scope, ToolbarService, OwsWmsLayerProducer, InfoPanelService) {
                if (console) console.log("Main called");
                $scope.ToolbarService = ToolbarService;
                OwsWmsLayerProducer.addService('http://erra.ccss.cz/geoserver/ows', 'armenia');
                
                $scope.$on('infopanel.updated', function(event) {
                    if(console) console.log('Attributes', InfoPanelService.attributes, 'Groups', InfoPanelService.groups);
                });
            }
        ]);

        return module;
    });
