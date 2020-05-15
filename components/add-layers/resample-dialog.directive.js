/**
 * @param HsConfig
 */
export default function (HsConfig) {
  'ngInject';
  return {
    template: require('./partials/dialog_proxyconfirm.html'),
    link: function (scope, element, attrs) {
      scope.resampleModalVisible = true;
    },
  };
}
