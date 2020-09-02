export default {
  template: require('./partials/remove-layer-dialog.html'),
  controller: function (
    $scope,
    $timeout,
    HsDrawService,
    HsMapService,
    HsCommonEndpointsService,
    $http
  ) {
    'ngInject';
    this.modalVisible = true;
    const vm = this;
    angular.extend(vm, {
      remove() {
        HsMapService.map.removeLayer(HsDrawService.selectedLayer);
        if (HsDrawService.selectedLayer.get('synchronize') == true) {
          (HsCommonEndpointsService.endpoints || [])
            .filter((ds) => ds.type == 'layman')
            .forEach((ds) => {
              $http.delete(
                `${ds.url}/rest/${
                  ds.user
                }/layers/${HsDrawService.selectedLayer
                  .get('title')
                  .toLowerCase()
                  .replace(/\s+/g, '')}`
              );
            });
        }
        HsDrawService.selectedLayer = null;
        HsDrawService.fillDrawableLayers();
      },
    });
  },
};
