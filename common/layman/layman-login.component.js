export default {
  template: require('./layman-login.html'),
  bindings: {
    url: '=',
  },
  controller: function ($scope) {
    'ngInject';
    this.modalVisible = true;
    $scope.$on('datasource-selector.layman_auth', () => {
      this.modalVisible = false;
    });
  },
};
