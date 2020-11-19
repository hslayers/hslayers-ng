export default {
  template: require('./select-type-to-add-layer-dialog.html'),
  bindings: {
    layer: '<',
    types: '<',
    endpoint: '<',
  },
  controller: function (HsDatasourceBrowserService,HsLayoutService) {
    'ngInject';
    this.modalVisible = true;
    const vm = this;
    vm.selectType = function (type) {
      vm.type = type;
      vm.alertChoose = false;
    };
    vm.add = function () {
      if (angular.isUndefined(vm.type)) {
        vm.alertChoose = true;
      } else {
        vm.modalVisible = false;
        HsDatasourceBrowserService.addLayerToMap(
          vm.endpoint,
          vm.layer,
          vm.type
        );
        HsLayoutService.setMainPanel('layermanager');
      }
    };
  },
};
