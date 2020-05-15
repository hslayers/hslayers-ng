/**
 * @param HsLayoutService
 */
export default function (HsLayoutService) {
  'ngInject';
  return {
    template: require('./partials/searchinput.html'),
    replace: true,
    link: function (scope, element) {
      scope.layoutService = HsLayoutService;
    },
  };
  /**
   * @memberof hs.search
   * @ngdoc directive
   * @name hs.search.directiveSearchresults
   * @description Add search results template to page
   */
}
