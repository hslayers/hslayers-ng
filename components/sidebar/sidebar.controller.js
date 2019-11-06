export default ['$scope', '$timeout', 'hs.map.service', 'Core', 'hs.permalink.urlService', '$window', '$cookies', 'hs.sidebar.service', 'hs.language.service', 'hs.layout.service',
    function ($scope, $timeout, OlMap, Core, bus, $window, $cookies, service, languageService, layoutService) {
        $scope.Core = Core;
        $scope.languageService = languageService;
        $scope.panelEnabled = layoutService.panelEnabled;
        $scope.layoutService = layoutService;
        /**
         * Set current active panel in sidebar
         * @memberof hs.sidebar.controller
         * @function setMainPanel
         * @param {string} which Name of panel to set active
         */
        $scope.setMainPanel = function (which) {
            $timeout(function () { layoutService.setMainPanel(which, true); })
        }

        if (bus.getParamValue('hs_panel')) {
            $scope.setMainPanel(bus.getParamValue('hs_panel'));
        }

        $scope.service = service;

        /**
         * Toggle sidebar mode between expanded and narrow
         * @memberof hs.sidebar.controller
         * @function toggleSidebar
         */
        $scope.toggleSidebar = function () {
            layoutService.sidebarExpanded = !layoutService.sidebarExpanded;
        };

        $scope.$emit('scope_loaded', "Sidebar");
    }

]