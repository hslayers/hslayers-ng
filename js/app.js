'use strict';

angular.module('hs', ['ngRoute', 'hs.layermanager', 'hs.map', 'hs.ows', 'hs.query', 'hs.search', 'hs.print', 'hs.permalink', 'hs.lodexplorer'])

.value('default_layers', [
        new ol.layer.Tile({source: new ol.source.OSM(), title: "Base layer"})
                         ])

.controller('Main', ['$scope',
    function($scope) {
       if(console) console.log("Main called");
    }
]);;