export default [
  'HsConfig',
  function (config) {
    return {
      template: require('./partials/dialog_overwriteconfirm.html'),
      link: function (scope, element, attrs) {
        scope.overwriteModalVisible = true;
      },
    };
  },
];
