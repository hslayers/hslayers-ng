/**
 * @param HsConfig
 */
export default function (HsConfig) {
  'ngInject';
  return {
    template: require('./partials/dialog_removeall.html'),
    link: function (scope, element, attrs) {
      scope.removeAllModalVisible = true;
    },
  };
}
