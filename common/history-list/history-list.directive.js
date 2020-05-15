/**
 * @param HsConfig
 */
export default function (HsConfig) {
  'ngInject';
  return {
    template: require('./history-list.directive.html'),
    scope: {
      what: '@what',
      clicked: '=clicked',
    },
    replace: true,
    transclude: true,
    controller: function ($scope, HsHistoryListService) {
      'ngInject';
      $scope.items = HsHistoryListService.readSourceHistory($scope.what);
    },
  };
}
