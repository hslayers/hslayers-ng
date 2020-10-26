/**
 * @param HsLayoutService
 * @param HsLayermanagerService
 * @param $window
 * @param $timeout
 */
export default function (
  HsLayoutService,
  HsLayermanagerService,
  $window,
  $timeout
) {
  'ngInject';
  return {
    template: require('./partials/basemap-gallery.html'),

    controller: [
      '$scope',
      function ($scope) {
        $scope.LayerManager = HsLayermanagerService;
        $scope.changeBaseLayerVisibility =
          HsLayermanagerService.changeBaseLayerVisibility;
        $scope.data = HsLayermanagerService.data;
        $scope.toggleMiniMenu = function (layer) {
          if (layer.galleryMiniMenu) {
            layer.galleryMiniMenu = !layer.galleryMiniMenu;
          } else {
            layer.galleryMiniMenu = true;
          }
        };
        $scope.toggleBasemap = function (layer) {
          if (arguments.length > 0) {
            if (!layer.active) {
              HsLayermanagerService.changeBaseLayerVisibility(true, layer);
              $scope.baseLayersExpanded = false;
            }
          } else {
            $scope.baseLayersExpanded = false;
            HsLayermanagerService.changeBaseLayerVisibility()
          }
        };
        $scope.galleryStyle = function () {
          if (
            !HsLayoutService.sidebarRight ||
            (HsLayoutService.layoutElement.clientWidth <= 767 &&
              $window.innerWidth <= 767)
          ) {
            return {right: '15px'};
          } else {
            return {right: HsLayoutService.panelSpaceWidth() + 20 + 'px'};
          }
        };

        $scope.fitsInContainer = () => {
          return (
            (HsLayermanagerService.data.baselayers.length + 1) * 150 <
            HsLayoutService.layoutElement.clientWidth -
              HsLayoutService.panelSpaceWidth() -
              450
          );
        };
      },
    ],
  };
}
