/**
 * @param HsConfig
 */
export default function (HsConfig) {
  'ngInject';
  return {
    template: require('./partials/dialog_overwriteconfirm.html'),
    link: function (scope, element, attrs) {
      scope.overwriteModalVisible = true;
    },
  };
}
