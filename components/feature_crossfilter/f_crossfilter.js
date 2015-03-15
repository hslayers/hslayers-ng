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

        .controller('FeatureCrossfilter', ['$scope', 'OlMap', 'feature_crossfilter',
            function($scope, OlMap, feature_crossfilter) {
                var map = OlMap.map;

                $scope.ajax_loader = hsl_path + 'components/lodexplorer/ajax-loader.gif';
                $scope.loading = false;
                $scope.groupings = [];
                
                setTimeout(function(){
                    feature_crossfilter.makeCrossfilterDimensions(OlMap.map.getLayers().item(2).getSource(), ["http://gis.zcu.cz/poi#category_os"]);
                }, 4000);
                
                $scope.$on('infopanel.updated', function(event) {});

                $scope.$emit('scope_loaded', "FeatureCrossfilter");
            }
        ]);

    })
