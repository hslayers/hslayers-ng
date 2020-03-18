export default ['config', function (config) {
  return {
    template: require('./partials/layer-vector-directive.html'),
    scope: {
      layerStyle: '<',
      geometryType: '<'
    }
  };
}];
