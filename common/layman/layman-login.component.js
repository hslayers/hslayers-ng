export default {
  template: require('./layman-login.html'),
  bindings: {
    url: '=',
  },
  controller: function ($scope) {
    'ngInject';
    this.modalVisible = true;
    $scope.$on('authChange', () => {
      this.modalVisible = false;
    });
  },
};
