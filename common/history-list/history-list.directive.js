export default ['config', function (config) {
    return {
        template: require('common/history-list/history-list.directive.html'),
        scope: {
            what: '@what',
            clicked: '=clicked'
        },
        replace: true,
        transclude: true,
        controller: ['$scope', 'hs.historyListService', function($scope, historyListService){
            $scope.items = historyListService.readSourceHistory($scope.what);
        }]

    };
}]