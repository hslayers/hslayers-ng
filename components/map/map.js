define(['angular', 'app', 'permalink'], function(angular) {
    angular.module('hs.map', ['hs'])
        //This is used to share map object between components.
        .service('OlMap', ['default_view', function(default_view) {
            this.map = new ol.Map({
                target: 'map',
                view: default_view
            });
        }])

    .directive('map', function() {
        return {
            templateUrl: hsl_path + 'components/map/partials/map.html'
        };
    })

    .controller('Map', ['$scope', 'OlMap', 'default_layers', 'default_view', 'BrowserUrlService',
        function($scope, OlMap, default_layers, default_view, bus) {
            if (console) console.log("Map loaded");
            for (var lyr in default_layers) {
                OlMap.map.addLayer(default_layers[lyr]);
            }
            if (bus.getParamValue('hs_x') && bus.getParamValue('hs_y') && bus.getParamValue('hs_z')) {
                var view = OlMap.map.getView();
                var loc = location.search;
                view.setCenter([parseFloat(bus.getParamValue('hs_x', loc)), parseFloat(bus.getParamValue('hs_y', loc))]);
                view.setZoom(parseInt(bus.getParamValue('hs_z', loc)));
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
