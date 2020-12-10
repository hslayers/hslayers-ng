/**
 * @param HsConfig
 */
export default function (HsConfig) {
  'ngInject';
  return {
    template: require('./partials/add-layers-url.directive.html'),
    scope: {
      type: '@type',
      url: '=url',
      connect: '=connect',
      field: '=field',
    },
    controller: [
      '$scope',
      'HsHistoryListService',
      function ($scope, historyListService) {
        $scope.items = historyListService.readSourceHistory($scope.what);
        $scope.historySelected = function (url) {
          $scope.url = url;
        };
        $scope.log = function (){
          console.log($scope)
        }
      },
    ],
  };
}
