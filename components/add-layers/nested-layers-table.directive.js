export default ['config', function (config) {
    return {
        template: require('./partials/nested-layers-table.directive.html'),
        scope: {
            layers: '=layers'
        },
        controller: ['$scope', function ($scope) {
            
        }]

    };
}]