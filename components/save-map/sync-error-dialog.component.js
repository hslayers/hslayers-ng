export default {
  template: require('./sync-error-dialog.html'),
  bindings: {
    exception: '<',
  },
  controller: [
    '$http',
    '$scope',
    function ($http, $scope) {
      this.modalVisible = true;
      const vm = this;
    },
  ],
};
