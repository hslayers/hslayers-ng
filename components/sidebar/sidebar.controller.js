export default ['$scope', '$timeout', 'hs.map.service', 'Core', 'hs.permalink.urlService', '$window', '$cookies', 'hs.sidebar.service',
    function ($scope, $timeout, OlMap, Core, bus, $window, $cookies, service) {
        $scope.Core = Core;
        /**
         * Set current active panel in sidebar
         * @memberof hs.sidebar.controller
         * @function setMainPanel
         * @param {string} which Name of panel to set active
         * @param {boolean} queryable 
         */
        $scope.setMainPanel = function (which, queryable) {
            $timeout(function () { Core.setMainPanel(which, true, queryable); })
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
            $scope.Core.sidebarExpanded = !$scope.Core.sidebarExpanded;
        };

        $scope.$emit('scope_loaded', "Sidebar");
    }

]