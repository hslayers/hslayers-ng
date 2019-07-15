export default ['config', function (config) {
    return {
        template: require('components/legend/partials/layer-directive.html'),
        scope: {
            layer: '=',
        }
    };
}]