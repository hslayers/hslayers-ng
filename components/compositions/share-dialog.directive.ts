/**
 * @param HsConfig
 */
export default function (HsConfig) {
  'ngInject';
  return {
    template: require('./partials/dialog_share.html'),
    link: function (scope, element, attrs) {
      scope.shareModalVisible = true;
    },
  };
}
