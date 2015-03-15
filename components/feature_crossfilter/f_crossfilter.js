define(['angular', 'ol', 'dc', 'map'],

    function(angular, ol, dc) {
        var module = angular.module('hs.feature_crossfilter', ['hs.map'])
            .directive('featureCrossfilter', function() {
                return {
                    templateUrl: hsl_path + 'components/feature_crossfilter/partials/f_crossfilter.html',
                    link: function(scope, element) {

                    }
                };
            })

        .controller('FeatureCrossfilter', ['$scope', 'OlMap', 
            function($scope, OlMap) {
                var map = OlMap.map;

                $scope.ajax_loader = hsl_path + 'components/lodexplorer/ajax-loader.gif';
                $scope.loading = false;
                $scope.groupings = [];

                $scope.$emit('scope_loaded', "FeatureCrossfilter");
            }
        ]);

    })
