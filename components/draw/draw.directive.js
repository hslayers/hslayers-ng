export default [
  'HsConfig',
  function (config) {
    return {
      template: require('./partials/draw.directive.html'),
      controller: 'HsDrawController',
    };
  },
];
