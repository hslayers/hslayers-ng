export default [
  'HsConfig',
  'HsLayoutService',
  function (config, layoutService) {
    return {
      template: require('./partials/searchinput.html'),
      replace: true,
      link: function (scope, element) {
        scope.layoutService = layoutService;
      },
    };
    /**
     * @memberof hs.search
     * @ngdoc directive
     * @name hs.search.directiveSearchresults
     * @description Add search results template to page
     */
  },
];
