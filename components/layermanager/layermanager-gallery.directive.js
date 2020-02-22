export default [
  'config',
  'hs.layout.service',
  'hs.layermanager.service',
  '$window',
  '$timeout',
  function(config, layoutService, LayMan, $window, $timeout) {
    return {
      template: require('./partials/basemap-gallery.html'),

      controller: [
        '$scope',
        function($scope) {
          $scope.LayMan = LayMan;
          $scope.changeBaseLayerVisibility = LayMan.changeBaseLayerVisibility;
          $scope.data = LayMan.data;
          $scope.toggleMiniMenu = function(layer) {
            if (layer.galleryMiniMenu) {
              layer.galleryMiniMenu = !layer.galleryMiniMenu;
            } else {
              layer.galleryMiniMenu = true;
            }
          };
          $scope.closeGallery = function(layer) {
            if (arguments.length > 0) {
              if (!layer.active) {
                $scope.baseLayersExpanded = false;
              }
            } else {
              $scope.baseLayersExpanded = false;
            }
          };
          $scope.galleryStyle = function() {
            if (!layoutService.sidebarRight || (layoutService.layoutElement.clientWidth <= 767 && $window.innerWidth <= 767)) {
              return {right: '15px'};
            } else {
              return {right: layoutService.panelSpaceWidth() + 20 + 'px'};
            }
          };

          $scope.fitsInContainer = () => {
            return (
              (LayMan.data.baselayers.length + 1) * 150 <
							layoutService.layoutElement.clientWidth - layoutService.panelSpaceWidth() - 450
            );
          };
          $scope.setGreyscale = function(layer) {
            const layerContainer = document.querySelector('.ol-unselectable > div:first-child');
            if (layerContainer.classList.contains('hs-grayscale')) {
              layerContainer.classList.remove('hs-grayscale');
              layer.grayscale = false;
            } else {
              layerContainer.classList.add('hs-grayscale');
              layer.grayscale = true;
            }
            $timeout(()=> {
              layer.galleryMiniMenu = false;
            }, 100);
          };
        }
      ]
    };
  }
];
