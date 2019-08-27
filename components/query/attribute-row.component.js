export default {
    template: require('./partials/attribute-row.html'),
    bindings: {
        attribute: '=',
        feature: '=',
        template: '='
    },
    controller: ['$scope', function ($scope) {
        angular.extend($scope, {
            change(){
                debugger;
                if($scope.ctrl.feature){
                    
                }
            }
        });
    }]
};
