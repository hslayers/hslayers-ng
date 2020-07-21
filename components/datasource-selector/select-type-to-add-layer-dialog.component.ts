export const HsSelectTypeToAddLayerDialogComponent = {
  template: require('./partials/select-type-to-add-layer-dialog.html'),
  bindings: {
    layer: '<',
    types: '<',
    endpoint: '<',
  },
  controller: function (HsDatasourceBrowserService) {
    'ngInject';
    this.modalVisible = true;
    const vm = this;
    vm.add = function () {
      if (vm.type === undefined) {
        vm.alertChoose = true;
      } else {
        vm.modalVisible = false;
        HsDatasourceBrowserService.addLayerToMap(
          vm.endpoint,
          vm.layer,
          vm.type
        );
      }
    };
  },
};
