define(['angular', 'app', 'permalink', 'ol'], function(angular, app, permalink, ol) {
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
            templateUrl: hsl_path + 'components/map/partials/map.html',
            link: function(scope, element) {
                $(".ol-zoomslider", element).width(28).height(200);
            }
        };
    })

    .controller('Map', ['$scope', 'OlMap', 'default_layers', 'default_view', 'BrowserUrlService',
        function($scope, OlMap, default_layers, default_view, bus) {
            var map = OlMap.map;

            $scope.moveToAndZoom = function(x, y, zoom) {
                var view = OlMap.map.getView();
                view.setCenter([x, y]);
                view.setZoom(zoom);
            }

            $scope.getMap = function() {
                return OlMap.map;
            }

            $scope.setTargetDiv = function(div_id) {
                OlMap.map.setTarget(div_id);
            }

            for (var lyr in default_layers) {
                OlMap.map.addLayer(default_layers[lyr]);
            }
            if (bus.getParamValue('hs_x') && bus.getParamValue('hs_y') && bus.getParamValue('hs_z')) {
                var loc = location.search;
                $scope.moveToAndZoom(parseFloat(bus.getParamValue('hs_x', loc)), parseFloat(bus.getParamValue('hs_y', loc)), parseInt(bus.getParamValue('hs_z', loc)));
            }
            map.addControl(new ol.control.ZoomSlider());
            map.addControl(new ol.control.ScaleLine());
            var mousePositionControl = new ol.control.MousePosition({
                coordinateFormat: ol.coordinate.createStringXY(4),
                undefinedHTML: '&nbsp;'
            });
            $scope.setTargetDiv("map")
                //map.addControl(mousePositionControl);
            $scope.$emit('scope_loaded', "Map");
        }
    ]);
})
