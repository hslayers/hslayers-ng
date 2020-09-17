/**
 * @param HsConfig
 */
export default function (HsConfig) {
  'ngInject';
  return {
    template: require('./partials/dialog_getcapabilities_error.html'),
    link: function (scope, element, attrs) {
      scope.capabilitiesErrorModalVisible = true;
    },
  };
}
