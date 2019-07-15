export default ['$scope', '$timeout', 'hs.mobile_toolbar.service', 'Core', '$window',
function ($scope, $timeout, service, Core, $window) {
    $scope.Core = Core;
    $scope.Core.sidebarRight = false;
    $scope.Core.sidebarExpanded = service.panelspace0pened;
    $scope.service = service;

    /**
     * @function setMainPanel
     * @memberOf hs.mobile_toolbar.controller
     * @params {} which
     * @description TODO
     */
    $scope.setMainPanel = function (which) {
        $timeout(function () { Core.setMainPanel(which, false); })
    }

    $scope.togglePanelspace = service.togglePanelspace;
    togglePanelspace = service.togglePanelspace;
    $scope.$emit('scope_loaded', "Mobile Toolbar");
}

]