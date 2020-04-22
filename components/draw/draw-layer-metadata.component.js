export default {
  template: require('./draw-layer-metadata.html'),
  bindings: {
    layer: '<',
  },
  controller: [
    '$http',
    '$scope',
    '$timeout',
    function ($http, $scope, $timeout) {
      this.modalVisible = true;
      const vm = this;
      $timeout(() => {
        vm.newLayerTitle = $scope.$ctrl.layer.get('title');
      }, 0);
      vm.titleChanged = function () {
        vm.layer.set('title', vm.newLayerTitle);
      };
    },
  ],
};
