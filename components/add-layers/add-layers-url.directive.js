export default ['config', function (config) {
    return {
        template: require('./partials/add-layers-url.directive.html'),
        scope: {
            type: '@type',
            url: '=url',
            connect: '=connect',
            field: '=field'
        },
        controller: ['$scope', 'hs.historyListService', function ($scope, historyListService) {
            $scope.items = historyListService.readSourceHistory($scope.what);
            $scope.historySelected = function(url){
                $scope.url = url;
            }
        }]

    };
}]