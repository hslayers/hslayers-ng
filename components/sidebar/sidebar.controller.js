export default ['$scope', '$timeout', 'hs.map.service', 'Core', 'hs.permalink.urlService', '$window', '$cookies', 'hs.sidebar.service', 'hs.layout.service', 'config',
    function ($scope, $timeout, OlMap, Core, bus, $window, $cookies, sidebarService, layoutService, config) {
        $scope = angular.extend($scope, {
            layoutService,
            sidebarService,
            showUnimportant: false,
            /**
             * Set visibility parameter of buttons object
             * @memberof hs.sidebar.controller
             * @function setPanelState
             * @param {object} buttons Buttons object
             */
            setPanelState(buttons) {
                for (let button of buttons) {
                    if (Core.exists(button.module) && layoutService.panelEnabled(button.panel) && $scope.checkConfigurableButtons(button)) {
                        if (!sidebarService.visibleButtons.includes(button.panel)) {
                            sidebarService.visibleButtons.push(button.panel)
                            button.visible = true;
                        }
                    }
                    else { button.visible = false }
                }
            },

            toggleUnimportant(){
                $scope.showUnimportant = !$scope.showUnimportant
            },

            visibilityByImportancy(button){
                return button.important || angular.isUndefined(button.important) || !sidebarService.unimportantExist 
                    || $scope.showUnimportant
            },
            
            /**
             * Checks whether the panels, which could be placed both in map or
             * in sidebar, have state defined in config.panelsEnabled. If yes it
             * should be placed in sidebar rather then in map.
             * It´s necessary for buttons like 'measure' because simple 
             * 'config.panelsEnabled = false' would prevent their functionality.
             * @memberof hs.sidebar.controller
             * @function checkConfigurableButtons
             * @param {object} button buttons Buttons object
             */
            checkConfigurableButtons(button) {
                if (typeof button.condition == "undefined") { return true }
                else if (angular.isUndefined(config.panelsEnabled)) {
                    return false
                } else {
                    return config.panelsEnabled[button.panel]
                }
            },

            /**
            * @ngdoc method
            * @name hs.sidebar.controller#fitsSidebar 
            * @public
            * @param {String} which Sidear button to be checked (specify panel name)
            * @description Check if sidebar button should be visible in classic sidebar or hidden inside minisidebar panel
            * @description Toggles minisidebar button
            */
            fitsSidebar(which) {
                if (window.innerWidth > 767) {
                    layoutService.minisidebar = false;
                    return true
                }
                else {
                    if ((sidebarService.visibleButtons.indexOf(which) + 1) >= (window.innerWidth / 60) && (window.innerWidth / 60) <= sidebarService.visibleButtons.length - 1) {
                        layoutService.minisidebar = true;
                        return true
                    }
                    if (window.innerWidth > (sidebarService.visibleButtons.length - 1) * 60) layoutService.minisidebar = false;
                }
            },

            /**
             * Set current active panel in sidebar
             * @memberof hs.sidebar.controller
             * @function setMainPanel
             * @param {string} which Name of panel to set active
             */
            setMainPanel(which) {
                $timeout(function () { layoutService.setMainPanel(which, true); })
            },

            /**
             * Toggle sidebar mode between expanded and narrow
             * @memberof hs.sidebar.controller
             * @function toggleSidebar
             */
            toggleSidebar() {
                layoutService.sidebarExpanded = !layoutService.sidebarExpanded;
            }
        });


        if (bus.getParamValue('hs_panel')) {
            if (Core.exists('hs.sidebar') && !layoutService.minisidebar)
                $scope.setMainPanel(bus.getParamValue('hs_panel'));
        }
        $scope.setPanelState(sidebarService.buttons)
        $scope.$emit('scope_loaded', "Sidebar");
    }

]