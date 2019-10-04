export default ['config', 'hs.layout.service', function (config, layoutService) {
    return {
        template: require('components/layout/partials/panel-header.directive.html'),
        transclude: {
            'extraButtons': '?extraButtons',
            'extraTitle': '?extraTitle'
        },
        scope: {
            panelName: "@",
            panelTitle: "=panelTitle"
        },
        controller: ['$scope', function ($scope) {                                   
            $scope.closePanel = layoutService.closePanel;
        }]
    };
}]