/**
 * @namespace hs.material.search
 * @memberOf hs
 */
define(['angular', 'ol','angular-material'],

    function(angular, ol, ngMaterial) {
        angular.module('hs.material.search', ['ngMaterial'])
            
            .directive('hs.material.search.directive', ['config', function (config) {
                return {
                    template: require('materialComponents/pageSystem/matSearch.html'),
                    link: function(scope, element) {

                    }
                };
            }])
            .controller('hs.material.search.controller', ['$scope', 'hs.search.service', 
                function($scope, SearchService) {
                    $scope.data = SearchService.data;
                    $scope.results = [];
                    /*$scope.init = function() {
                        if (permalink.getParamValue('search')) {
                            $scope.query = permalink.getParamValue('search');
                            Core.searchVisible(true);
                            $scope.queryChanged();
                        }
                    }*/
                    $scope.isDisabled = false;
                    $scope.noCache = false;
                    $scope.query = "";
                    $scope.queryChanged = function(query) {
                        SearchService.request($scope.query);
                    }

                    $scope.select = function(result) {
                        if (angular.isUndefined(result)) return;
                        var zoom_level = 10;
                        SearchService.selectResult(result,zoom_level);
                        $scope.clear();
                    }

                    $scope.clear = function() {
                        $scope.query = "";
                        SearchService.cleanResults();
                    }

                    $scope.searchResultsReceived = function(r) {
                        SearchService.showResultsLayer();
                        $scope.results.length = 0;
                        angular.forEach($scope.data.providers, function(provider){
                           angular.forEach(provider.results, function(result){
                               $scope.results.push(result);
                           }) 
                        });
                        if (!$scope.$$phase) $scope.$digest();
                    }

                    $scope.highlightResult = function(result, state) {
                        if (angular.isDefined(result.feature))
                            result.feature.set('highlighted', state)
                    }

                    $scope.$on('search.resultsReceived', function(e, r) {
                        $scope.searchResultsReceived(r);
                    });
                    
                    $scope.$emit('scope_loaded', "Search");
                }
            ]);
    })
