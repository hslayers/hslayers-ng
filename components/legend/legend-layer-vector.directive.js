export default ['config', function (config) {
    return {
        template: require('components/legend/partials/layer-vector-directive.html'),
        scope: {
            layerStyle: '<',
            geometryType: '<',
        }
    };
}]