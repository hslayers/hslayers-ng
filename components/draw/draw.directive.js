/**
 * @param HsConfig
 */
export default function (HsConfig) {
  'ngInject';
  return {
    template: require('./partials/draw.directive.html'),
    controller: 'HsDrawController',
  };
}
