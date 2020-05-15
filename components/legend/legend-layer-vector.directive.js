/**
 * @param HsConfig
 */
export default function (HsConfig) {
  'ngInject';
  return {
    template: require('./partials/layer-vector-directive.html'),
    scope: {
      layerStyle: '<',
      geometryType: '<',
    },
  };
}
