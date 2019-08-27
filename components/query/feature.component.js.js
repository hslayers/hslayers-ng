export default {
    template: require('./partials/feature.html'),
    bindings: {
        feature: '='
    },
    controller: ['$scope', function ($scope) {
        angular.extend($scope, {
 
        });
    }],
    transclude: false
};
