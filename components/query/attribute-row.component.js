export default {
    template: require('./partials/attribute-row.html'),
    bindings: {
        attribute: '<',
        feature: '<',
        readonly: '@',
        template: '<'
    },
    controller: ['$scope', function ($scope) {
        angular.extend($scope, {
            change() {
                if ($scope.$ctrl.feature && $scope.$ctrl.feature.feature) {
                    const feature = $scope.$ctrl.feature.feature;
                    feature.set($scope.$ctrl.attribute.name,
                        $scope.$ctrl.attribute.value);
                }
            }
        });
    }]
};
