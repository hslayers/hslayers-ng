/**
 * @param HsConfig
 */
export default function (HsConfig) {
  'ngInject';
  return {
    template: require('./partials/nested-layers-table.directive.html'),
    scope: {
      layers: '=layers',
    },
    controller: ['$scope', function ($scope) {}],
  };
}
