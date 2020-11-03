export default {
  template: require('./partials/dialog_error.html'),
  bindings: {
    error: '<',
    msg: '<',
  },
  controller: function ($scope, $timeout, $element, HsCompositionsService) {
    'ngInject';
    this.errorModalVisible = true;
  },
};
