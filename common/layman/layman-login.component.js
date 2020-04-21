export default {
  template: require('./layman-login.html'),
  bindings: {
    url: '=',
  },
  controller: [
    '$http',
    '$scope',
    function ($http, $scope) {
      this.modalVisible = true;
      $scope.$on('datasource-selector.layman_auth', () => {
        this.modalVisible = false;
      });
    },
  ],
};
