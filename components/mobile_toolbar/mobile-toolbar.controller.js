export default ['$scope', '$timeout', 'hs.mobile_toolbar.service', 'Core', '$window', 'hs.layout.service',
function ($scope, $timeout, service, Core, $window, layoutService) {
    $scope.Core = Core;
    layoutService.sidebarRight = false;
    sidebarExpanded.sidebarExpanded = service.panelspace0pened;
    $scope.layoutService = layoutService;
    $scope.service = service;

    /**
     * @function setMainPanel
     * @memberOf hs.mobile_toolbar.controller
     * @params {} which
     * @description TODO
     */
    $scope.setMainPanel = function (which) {
        $timeout(function () { layoutService.setMainPanel(which, false); })
    }

    $scope.togglePanelspace = service.togglePanelspace;
    togglePanelspace = service.togglePanelspace;
    $scope.$emit('scope_loaded', "Mobile Toolbar");
}

]