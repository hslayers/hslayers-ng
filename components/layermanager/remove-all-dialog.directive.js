export default [
  'HsConfig',
  function (config) {
    return {
      template: require('./partials/dialog_removeall.html'),
      link: function (scope, element, attrs) {
        scope.removeAllModalVisible = true;
      },
    };
  },
];
