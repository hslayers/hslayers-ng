export default {
  template: require('./confirm-dialog.html'),
  bindings: {
    message: '<',
    title: '<',
    callback: '<',
    note: '<'
  },
  controller: function ($scope) {
    'ngInject';
    this.modalVisible = true;
    this.yes = function () {
      this.modalVisible = false;
      this.callback('yes');
    };
    this.no = function () {
      this.modalVisible = false;
      this.callback('no');
    };
  },
};
