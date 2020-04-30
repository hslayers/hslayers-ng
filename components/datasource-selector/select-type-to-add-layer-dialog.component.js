export default {
  template: require('./select-type-to-add-layer-dialog.html'),
  bindings: {
    layer: '<',
    types: '<',
    endpoint: '<',
  },
  controller: [
    '$http',
    '$scope',
    'hs.datasourceBrowserService',
    function ($http, $scope, datasourceSelectorService) {
      this.modalVisible = true;
      const vm = this;
      vm.add = function () {
        if (angular.isUndefined(vm.type)) {
          vm.alertChoose = true;
        } else {
          vm.modalVisible = false;
          datasourceSelectorService.addLayerToMap(
            vm.endpoint,
            vm.layer,
            vm.type
          );
        }
      };
    },
  ],
};
