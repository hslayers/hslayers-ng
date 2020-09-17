export default {
  template: require('./layman-login.html'),
  bindings: {
    url: '=',
  },
  controller: function ($scope, HsCommonLaymanService) {
    'ngInject';
    this.modalVisible = true;
    HsCommonLaymanService.authChange.subscribe((endpoint) => {
      this.modalVisible = false;
    });
  },
};
