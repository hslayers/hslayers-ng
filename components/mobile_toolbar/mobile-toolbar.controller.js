export default ['$scope', '$timeout', 'HsMobileToolbarService', 'HsCore', '$window', 'HsLayoutService',
function ($scope, $timeout, service, HsCore, $window, layoutService) {
    $scope.HsCore = HsCore;
    layoutService.sidebarRight = false;
    sidebarExpanded.sidebarExpanded = service.panelspace0pened;
    $scope.layoutService = layoutService;
    $scope.service = service;

    /**
     * @function setMainPanel
     * @memberOf HsMobileToolbarController
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