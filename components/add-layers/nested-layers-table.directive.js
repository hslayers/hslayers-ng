/**
 * @param HsConfig
 */
export default function (HsConfig,HsAddLayersWmsAddLayerService) {
  'ngInject';
  return {
    template: require('./partials/nested-layers-table.directive.html'),
    scope: {
      layers: '=layers',
    },
    controller: [
      '$scope',
      function ($scope) {
        $scope.checkboxChange = HsAddLayersWmsAddLayerService.checkboxChange;
      },
    ],
  };
}
