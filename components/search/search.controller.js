export default ['$scope', 'Core', 'hs.search.service', 'hs.permalink.urlService', 'hs.layout.service', 'config', '$timeout',
  function ($scope, Core, SearchService, permalink, layoutService, config, $timeout) {
    $scope.data = SearchService.data;
    $scope.layoutService = layoutService;
    $scope.config = config;
    /**
     * Initialization of search state
     * @memberof HsSearchController
     * @function init
     */
    $scope.init = function () {
      $scope.query = '';
      $scope.clearvisible = false;
      if (permalink.getParamValue('search')) {
        $scope.query = permalink.getParamValue('search');
        Core.searchVisible(true);
        $scope.queryChanged();
      }
    };

    /**
     * Handler of search input, request search service and display results div
     * @memberof HsSearchController
     * @function queryChanged
     */
    $scope.queryChanged = function () {
      SearchService.request($scope.query);
    };

    /**
     * Zoom map to selected result from results list
     * @memberof HsSearchController
     * @function zoomTo
     * @param {object} result Selected result
     */
    $scope.zoomTo = function (result) {
      $scope.fcode_zoom_map = {
        'PPLA': 12,
        'PPL': 15,
        'PPLC': 10,
        'ADM1': 9,
        'FRM': 15,
        'PPLF': 13,
        'LCTY': 13,
        'RSTN': 15,
        'PPLA3': 9,
        'AIRP': 13,
        'AIRF': 13,
        'HTL': 17,
        'STM': 14,
        'LK': 13
      };
      let zoom_level = 10;
      if (angular.isDefined(result.fcode) && angular.isDefined($scope.fcode_zoom_map[result.fcode])) {
        zoom_level = $scope.fcode_zoom_map[result.fcode];
      }
      SearchService.selectResult(result, zoom_level);
      $scope.clear();
    };

    /**
     * Remove previous search and search results
     * @memberof HsSearchController
     * @function clear
     */
    $scope.clear = function () {
      $scope.query = '';
      $scope.clearvisible = false;
      SearchService.cleanResults();
    };

    /**
     * Handler for receiving results of search request, sends results to correct parser
     * @memberof HsSearchController
     * @function searchResultsReceived
     * @param {Object} r Result of search request
     * @param {string} provider Which provider sent the search results
     */
    $scope.searchResultsReceived = function (r) {
      $scope.searchResultsVisible = true;
      $scope.clearvisible = true;
      SearchService.showResultsLayer();
    };

    /**
     * Set property highlighted of result to state
     * @memberof HsSearchController
     * @function highlightResult
     * @param {object} result Record to highlight
     * @param {string} state To highlight or not to highlight
     */
    $scope.highlightResult = function (result, state) {
      if (angular.isDefined(result.feature)) {
        result.feature.set('highlighted', state);
      }
    };
    $scope.init();

    $scope.$on('search.resultsReceived', (e, r) => {
      $scope.searchResultsReceived(r);
    });

    $scope.$watch('layoutService.panelVisible("search")', (newValue, oldValue) => {
      if (newValue !== oldValue && newValue) {
        $timeout(() => {
          layoutService.contentWrapper.querySelector('.hs-search-address-input').focus();
        }, 500);
      }
    });
    $scope.$emit('scope_loaded', 'Search');
  }
];
