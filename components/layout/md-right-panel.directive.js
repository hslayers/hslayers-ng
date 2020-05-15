/**
 * @param HsConfig
 */
export default function (HsConfig) {
  'ngInject';
  return {
    replace: true,
    template: require('./partials/right-panel.html'),
  };
}
