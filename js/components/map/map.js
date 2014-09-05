angular.module('hs.map', [])
    //This is used to share map object between components.
    .service("OlMap", function() {
        this.map = new ol.Map({
            target: 'map',
            view: new ol.View({
                center: ol.proj.transform([17.474129,52.574000 ], 'EPSG:4326', 'EPSG:3857'),
                zoom: 4
            })
        });
    })

.directive('map', function() {
    return {
        templateUrl: 'js/components/map/partials/map.html'
    };
})

.controller('Map', ['$scope', 'OlMap',
    function($scope, OlMap) {
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