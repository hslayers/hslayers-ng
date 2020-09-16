export default {
  template: require('./layman-login.html'),
  bindings: {
    url: '=',
  },
  controller: function ($scope, HsCommonLaymanService) {
    'ngInject';
    this.modalVisible = true;
    HsCommonLaymanService.authenticated.subscribe((endpoint) => {
      this.modalVisible = false;
    });
  },
};
