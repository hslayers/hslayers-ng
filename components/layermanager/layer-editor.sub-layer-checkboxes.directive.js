export default [
  'hs.layerEditor.sublayerService',
  'hs.layermanager.service',
  function (subLayerService, LayMan) {
    return {
      template: require('./partials/sub-layer-checkboxes.html'),

      controller: [
        '$scope',
        function ($scope) {
          $scope.checkedSubLayers = subLayerService.checkedSubLayers;
          $scope.withChildren = subLayerService.withChildren;
          $scope.expanded = false;

          $scope.getSubLayers = function () {
            return subLayerService.getSubLayers();
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
                subLayerService.checkedSubLayersTmp[children.Name] = state;
              });
            }
            if (angular.isDefined($scope.checkedSubLayers[sublayer.Name])) {
              subLayerService.checkedSubLayersTmp[sublayer.Name] = state;
            } else {
              subLayerService.withChildrenTmp[sublayer.Name] = state;
            }
            return subLayerService.subLayerSelected();
          };
        },
      ],
    };
  },
];
