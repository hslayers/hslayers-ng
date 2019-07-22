export default ['config', 'Core', function (config, Core) {
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
            $scope.closePanel = Core.closePanel;
        }]
    };
}]