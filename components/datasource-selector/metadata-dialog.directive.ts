export default [
  function () {
    return {
      template: require('../datasource-selector/partials/dialog_metadata.html'),
      link: function (scope) {
        scope.metadataModalVisible = true;
      },
    };
  },
];
