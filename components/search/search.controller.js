export default ['$scope', 'Core', 'hs.search.service', 'hs.permalink.urlService', 'hs.layout.service',
    function ($scope, Core, SearchService, permalink, layoutService) {
        $scope.data = SearchService.data;
        $scope.layoutService = layoutService;

        /**
         * Initialization of search state
         * @memberof hs.search.controller
         * @function init 
         */
        $scope.init = function () {
            $scope.query = "";
            $scope.clearvisible = false;
            if (permalink.getParamValue('search')) {
                $scope.query = permalink.getParamValue('search');
                Core.searchVisible(true);
                $scope.queryChanged();
            }
        }

        /**
         * Handler of search input, request search service and display results div
         * @memberof hs.search.controller
         * @function queryChanged 
         */
        $scope.queryChanged = function () {
            SearchService.request($scope.query);
        }

        /**
         * Zoom map to selected result from results list
         * @memberof hs.search.controller
         * @function zoomTo 
         * @param {object} result Selected result 
         */
        $scope.zoomTo = function (result) {
            $scope.fcode_zoom_map = {
                'PPLA': 12,
                'PPL': 15,
                'PPLC': 10,
                "ADM1": 9,
                'FRM': 15,
                'PPLF': 13,
                'LCTY': 13,
                'RSTN': 15,
                "PPLA3": 9,
                'AIRP': 13,
                'AIRF': 13,
                'HTL': 17,
                'STM': 14,
                'LK': 13
            };
            var zoom_level = 10;
            if (angular.isDefined(result.fcode) && angular.isDefined($scope.fcode_zoom_map[result.fcode])) {
                zoom_level = $scope.fcode_zoom_map[result.fcode];
            }
            SearchService.selectResult(result, zoom_level);
            $scope.clear();
        }

        /**
         * Remove previous search and search results
         * @memberof hs.search.controller
         * @function clear 
         */
        $scope.clear = function () {
            $scope.query = '';
            $scope.clearvisible = false;
            SearchService.cleanResults();
        }

        /**
         * Handler for receiving results of search request, sends results to correct parser
         * @memberof hs.search.controller
         * @function searchResultsReceived
         * @param {object} response Result of search request
         * @param {string} provider Which provider sent the search results
         */
        $scope.searchResultsReceived = function (r) {
            $scope.searchResultsVisible = true;
            $scope.clearvisible = true;
            SearchService.showResultsLayer();
        }

        /**
         * Set property highlighted of result to state
         * @memberof hs.search.controller
         * @function highlightResult
         * @param {object} result
         * @param {string} state
         */
        $scope.highlightResult = function (result, state) {
            if (angular.isDefined(result.feature))
                result.feature.set('highlighted', state)
        }
        $scope.init();

        $scope.$on('search.resultsReceived', function (e, r) {
            $scope.searchResultsReceived(r);
        });

        $scope.$watch('layoutService.panelVisible("search")', function (newValue, oldValue) {
            if (newValue !== oldValue && newValue) {
                setTimeout(function () {
                    document.getElementById('search_address').focus();
                }, 500);
            }
        });
        $scope.$emit('scope_loaded', "Search");
    }
]