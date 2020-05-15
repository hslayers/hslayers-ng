export default [
  'HsConfig',
  function (config) {
    return {
      template: require('./partials/dialog_proxyconfirm.html'),
      link: function (scope, element, attrs) {
        scope.resampleModalVisible = true;
      },
    };
  },
];
