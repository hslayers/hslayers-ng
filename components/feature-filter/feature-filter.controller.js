export default ['$scope', 'hs.map.service', 'Core', 'hs.featureFilter.service', 'hs.layermanager.service', 'config',
    function ($scope, OlMap, Core, service, LayMan, config) {
        var map = OlMap.map;

        $scope.map = OlMap.map;
        $scope.LayMan = LayMan;

        $scope.applyFilters = service.applyFilters;

        $scope.allSelected = function (filter) {
            return filter.selected ? filter.selected.length === filter.values.length : false;
        };

        $scope.isIndeterminate = function (filter) {
            return filter.selected ? (filter.selected.length !== 0 && filter.selected.length !== filter.values.length) : false;
        };

        $scope.exists = function (item, list) {
            return list.indexOf(item) > -1;
        };

        $scope.toggle = function (value, selected) {
            var idx = selected.indexOf(value);
            if (idx > -1) {
                selected.splice(idx, 1);
            } else {
                selected.push(value);
            }
        };

        $scope.toggleAll = function (filter) {
            if (filter.selected.length === filter.values.length) {
                filter.selected = [];
            } else {
                filter.selected = filter.values.slice(0);
            }
        };

        $scope.$emit('scope_loaded', "featureFilter");



        // $rootScope.$on('layermanager.layer_added', function (e, layer) {
        //     service.prepLayerFilter(layer);

        //     if (layer.layer instanceof VectorLayer) {
        //         var source = layer.layer.getSource();
        //         console.log(source.getState());
        //         var listenerKey = source.on('change', function (e) {
        //             if (source.getState() === 'ready') {
        //                 console.log(source.getState());
        //                 Observable.unByKey(listenerKey);
        //                 service.prepLayerFilter(layer);
        //                 $scope.applyFilters(layer);
        //             }
        //         });
        //     }
        // });
    }
]