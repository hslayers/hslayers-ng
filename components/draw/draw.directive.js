export default ['config', function (config) {
  return {
    template: require('./partials/draw.directive.html'),
    controller: 'HsDrawController'
  };
}];
