export default ['$scope', 'hs.map.service', 'Core', 'hs.featureFilter.service', 'hs.layermanager.service', 'config',
    function ($scope, OlMap, Core, service, LayMan, config) {
        window.scope = $scope;
        $scope.map = OlMap.map;
        $scope.LayMan = LayMan;

        $scope.applyFilters = service.applyFilters;

        $scope.displayDetails = false;

        $scope.toggleFeatureDetails = function (feature) {
            $scope.displayDetails = !$scope.displayDetails;
            if ($scope.selectedFeature) $scope.selectedFeature.setStyle(null);

            if ($scope.displayDetails) {
                $scope.featureDetails = feature.values_;
                $scope.selectedFeature = feature;
                OlMap.moveToAndZoom(feature.values_.geometry.flatCoordinates[0], feature.values_.geometry.flatCoordinates[1], 7);
                feature.setStyle(new Style({
                    image: new Icon(({
                        crossOrigin: 'anonymous',
                        src: 'marker_lt.png',
                        anchor: [0.5, 1],
                        scale: 0.4,
                    }))
                }))
            }
        };

        $scope.$emit('scope_loaded', "featureList");
    }
]