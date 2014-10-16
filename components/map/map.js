define(['angular', 'app'], function (angular) {
    angular.module('hs.map', ['hs'])
        //This is used to share map object between components.
        .service("OlMap", function() {
            this.map = new ol.Map({
                target: 'map',
                view: new ol.View({                                   
                    center: ol.proj.transform([17.474129,52.574000 ], 'EPSG:4326', 'EPSG:3857'), //Latitude longitude    to Spherical Mercator
                    zoom: 4
                })
            });
        })

    .directive('map', function() {
        return {
            templateUrl: 'components/map/partials/map.html'
        };
    })

    .controller('Map', ['$scope', 'OlMap', 'default_layers', 
        function($scope, OlMap, default_layers) {
            if(console) console.log("Map loaded");
            for(var lyr in default_layers){
                OlMap.map.addLayer(default_layers[lyr]);
            }
            $scope.map = OlMap.map;
            OlMap.map.setTarget("map");
            OlMap.map.addControl(new ol.control.ZoomSlider());
            OlMap.map.addControl(new ol.control.ScaleLine());
            var mousePositionControl = new ol.control.MousePosition({
                coordinateFormat: ol.coordinate.createStringXY(4),
                undefinedHTML: '&nbsp;'
            });
            OlMap.map.addControl(mousePositionControl);

        }
    ]);
})