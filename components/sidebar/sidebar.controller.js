export default ['$scope', '$timeout', 'hs.map.service', 'Core', 'hs.permalink.urlService', '$window', '$cookies', 'hs.sidebar.service', 'hs.language.service', 'hs.layout.service', 'gettext',
    function ($scope, $timeout, OlMap, Core, bus, $window, $cookies, service, languageService, layoutService, gettext) {
        $scope = angular.extend($scope, {
            layoutService,
            buttons: [
                { panel: 'layermanager', module: 'hs.layermanager', order:0, title: gettext('Layer Manager'), description: gettext('Manage and style your layers in composition'), icon: 'icon-layers' },
                { panel: 'legend', module: 'hs.legend', order:1, title: gettext('Legend'), description: gettext('Legend'), icon: 'icon-dotlist' },
                { panel: 'info', module: 'hs.query', order:7, title: gettext('Info panel'), description: gettext('Display map-query result information'), icon: 'icon-info-sign' },
                { panel: 'composition_browser', module: 'hs.compositions', order:3, title: gettext('Map Compositions'), description: gettext('List available map compositions'), icon: 'icon-map' },
                { panel: 'datasource_selector', module: 'hs.datasource_selector', order:4, title: gettext('Add layers'), description: gettext('Select data or services for your map composition'), icon: 'icon-database' },
                { panel: 'feature_crossfilter', module: 'hs.feature_crossfilter.controller', order:5, title: gettext('Filter features'), description: gettext('Crossfilter'), icon: 'icon-analytics-piechare' },
                { panel: 'sensors', module: 'hs.sensors', order:6, title: gettext('Sensors'), description: gettext(''), icon: 'icon-weightscale' },
                { panel: 'measure', module: 'hs.measure.controller', order:2, title: gettext('Measurements'), description: gettext('Measure distance or area at map'), icon: 'icon-design' },
                { panel: 'routing', module: 'hs.routing.controller', order:8, title: gettext('Routing'), description: gettext(''), icon: 'icon-road' },
                { panel: 'tracking', module: 'hs.tracking.controller', order:9, title: gettext('Tracking'), description: gettext(''), icon: 'icon-screenshot' },
                { panel: 'print', module: 'hs.print', order:10, title: gettext('Print'), description: gettext('Print map'), icon: 'icon-print' },
                { panel: 'permalink', module: 'hs.permalink', order:11, title: gettext('Share map'), description: gettext('Share map'), icon: 'icon-share-alt' },
                { panel: 'saveMap', module: 'hs.save-map', order:12, title: gettext('Save composition'), description: gettext('Save content of map to composition'), icon: 'icon-save-floppy' },
                { panel: 'language', module: 'hs.language.controller', order:13, title: gettext('Change language'), description: gettext('Change language'), content: function () {return languageService.getCurrentLanguageCode().toUpperCase() } },
                { panel: 'mobile_settings', module: 'hs.mobile_settings.controller', order:14, title: gettext('Application settings'), description: gettext('Specify application user settings'), icon: 'icon-settingsandroid' }
            ],
            visibleButtons: [],
             /**
             * Calculate visibility of button by taking into account if its 
             * module is loaded and if the button is enabled in conf 
             * panelsEnabled object.
             * @memberof hs.sidebar.controller
             * @function buttonVisible
             * @param {object} button Button definition object
             */
            buttonVisible(button) {
                if (Core.exists(button.module) && layoutService.panelEnabled(button.panel)){
                    if(!$scope.visibleButtons.includes(button.panel)) !$scope.visibleButtons.push(button.panel)
                    return true
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
            fitsSidebar(which){
                if (window.innerWidth > 767) {
                    layoutService.minisidebar = false;
                    return true
                }
                else {
                    if (( $scope.visibleButtons.indexOf(which)+1) >= (window.innerWidth / 60) && (window.innerWidth / 60) <=  $scope.visibleButtons.length-1 ) {
                        layoutService.minisidebar = true;
                        return true
                    }
                    if (window.innerWidth > ( $scope.visibleButtons.length-1)* 60) layoutService.minisidebar = false;
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
            if(Core.exists('hs.sidebar') && !layoutService.minisidebar)
            $scope.setMainPanel(bus.getParamValue('hs_panel'));
        }

        $scope.$emit('scope_loaded', "Sidebar");
    }

]