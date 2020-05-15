/**
 * @param HsLayoutService
 */
export default function (HsLayoutService) {
  'ngInject';
  return {
    template: require('./partials/panel-header.directive.html'),
    transclude: {
      'extraButtons': '?extraButtons',
      'extraTitle': '?extraTitle',
    },
    scope: {
      panelName: '@',
      panelTitle: '=panelTitle',
    },
    controller: [
      '$scope',
      function ($scope) {
        $scope.closePanel = HsLayoutService.closePanel;
      },
    ],
  };
}
