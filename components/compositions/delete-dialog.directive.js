/**
 * @param HsConfig
 */
export default function (HsConfig) {
  'ngInject';
  return {
    template: require('./partials/dialog_delete.html'),
    link: function (scope, element, attrs) {
      scope.deleteModalVisible = true;
    },
  };
}
