/**
 * @param HsLayerEditorSublayerService
 */
export default function (HsLayerEditorSublayerService, HsLayermanagerService) {
  'ngInject';
  return {
    template: require('./partials/sub-layer-checkboxes.html'),

    controller: [
      '$scope',
      function ($scope) {
        $scope.checkedSubLayers = HsLayerEditorSublayerService.checkedSubLayers;
        $scope.withChildren = HsLayerEditorSublayerService.withChildren;
        $scope.expanded = false;
        $scope.HsLayermanagerService = HsLayermanagerService;
        $scope.getSubLayers = function () {
          return HsLayerEditorSublayerService.getSubLayers();
        };

        $scope.subLayerIsString = function (subLayer) {
          return typeof subLayer == 'string';
        };

        $scope.toggleExpanded = function () {
          $scope.expanded = !$scope.expanded;
        };
        /**
         * @function toggleSublayersVisibility
         * @memberOf hs.layermanager.layer-editor.sub-layer-checkboes
         * @description Controls state of layer´s sublayers manipulated by input checkboxes
         * @param {object} sublayer Selected sublayer
         * @param {object} state New state of sublayer
         */
        $scope.subLayerSelected = function (sublayer, state) {
          if (angular.isDefined(sublayer) && sublayer.Layer) {
            angular.forEach(sublayer.Layer, (children) => {
              angular.extend($scope.checkedSubLayers, {
                [children.Name]: state,
              });
              HsLayerEditorSublayerService.checkedSubLayersTmp[
                children.Name
              ] = state;
            });
          }
          if (angular.isDefined($scope.checkedSubLayers[sublayer.Name])) {
            HsLayerEditorSublayerService.checkedSubLayersTmp[
              sublayer.Name
            ] = state;
          } else {
            HsLayerEditorSublayerService.withChildrenTmp[sublayer.Name] = state;
          }
          return HsLayerEditorSublayerService.subLayerSelected();
        };
      },
    ],
  };
}
